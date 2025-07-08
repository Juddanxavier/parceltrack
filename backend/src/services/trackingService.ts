import { PrismaClient, TrackingStatus, Shipment } from '@prisma/client';
import { customAlphabet } from 'nanoid';

// Configure nanoid for tracking number generation
// Using numbers and uppercase letters, excluding similar looking characters
const generateTrackingNumber = customAlphabet(
  '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', // Excluding I, O
  12 // length of the tracking number
);

export class TrackingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new shipment with a unique tracking number
   */
  async createShipment(data: {
    userId?: string;
    carrier?: string;
    carrierTrackingNumber?: string;
    estimatedDelivery?: Date;
  }): Promise<Shipment> {
    const trackingNumber = await this.generateUniqueTrackingNumber();

    return this.prisma.shipment.create({
      data: {
        trackingNumber,
        carrier: data.carrier,
        carrierTrackingNumber: data.carrierTrackingNumber,
        estimatedDelivery: data.estimatedDelivery,
        userId: data.userId,
      },
    });
  }

  /**
   * Generate a unique tracking number
   */
  private async generateUniqueTrackingNumber(): Promise<string> {
    let trackingNumber: string;
    let exists: boolean;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
      if (attempts >= MAX_ATTEMPTS) {
        throw new Error('Failed to generate unique tracking number after multiple attempts');
      }
      trackingNumber = generateTrackingNumber();
      exists = await this.prisma.shipment.findUnique({
        where: { trackingNumber },
      }).then(Boolean);
      attempts++;
    } while (exists);

    return trackingNumber;
  }

  /**
   * Get shipment details by tracking number
   */
  async getShipment(trackingNumber: string) {
    return this.prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  /**
   * Update shipment status and add a tracking event
   */
  async updateShipmentStatus(
    trackingNumber: string,
    status: TrackingStatus,
    data: {
      description: string;
      location?: string;
      timestamp?: Date;
    }
  ) {
    const timestamp = data.timestamp || new Date();

    return this.prisma.$transaction(async (tx) => {
      // Update shipment status
      const shipment = await tx.shipment.update({
        where: { trackingNumber },
        data: {
          status,
          // If status is DELIVERED, set actualDelivery time
          ...(status === 'DELIVERED' && { actualDelivery: timestamp }),
        },
      });

      // Create tracking event
      await tx.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status,
          description: data.description,
          location: data.location,
          timestamp,
        },
      });

      return shipment;
    });
  }

  /**
   * List shipments with optional filters
   */
  async listShipments(params: {
    userId?: string;
    status?: TrackingStatus;
    page?: number;
    limit?: number;
  }) {
    const { userId, status, page = 1, limit = 20 } = params;

    const where = {
      ...(userId && { userId }),
      ...(status && { status }),
    };

    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        include: {
          events: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      shipments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
