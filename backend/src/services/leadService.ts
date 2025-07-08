import { PrismaClient, Lead, LeadStatus, User, Prisma } from '@prisma/client';

const { Decimal } = Prisma;

interface LeadCreateInput {
  name: string;
  email: string;
  phone: string;
  originCountry: string;
  destinationCountry: string;
  parcelType: string;
  weight: number;
  notes: string;
  clientId?: string;
}

interface LeadUpdateInput extends Partial<LeadCreateInput> {
  status?: LeadStatus;
  assignedTo?: string;
}

interface LeadFilters {
  status?: LeadStatus;
  assignedTo?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

interface LeadListResponse {
  leads: (Lead & {
    client?: Pick<User, 'name' | 'email'>;
    assignedAdmin?: Pick<User, 'name' | 'email'>;
  })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class LeadService {
  constructor(private prisma: PrismaClient) {}

  private formatLead(lead: Lead & {
    client?: User;
    assignedAdmin?: User;
  }) {
    return {
      ...lead,
      weight: lead.weight instanceof Decimal ? lead.weight.toNumber() : lead.weight,
      client: lead.client ? {
        name: lead.client.name,
        email: lead.client.email,
      } : undefined,
      assignedAdmin: lead.assignedAdmin ? {
        name: lead.assignedAdmin.name,
        email: lead.assignedAdmin.email,
      } : undefined,
    };
  }

  /**
   * Create a new lead
   */
  async createLead(data: LeadCreateInput): Promise<Lead> {
    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        weight: new Decimal(data.weight),
      },
      include: {
        client: true,
        assignedAdmin: true,
      },
    });

    return this.formatLead(lead);
  }

  /**
   * Get lead by ID
   */
  async getLead(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        client: true,
        assignedAdmin: true,
      },
    });

    if (!lead) return null;
    return this.formatLead(lead);
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    id: string,
    status: LeadStatus,
    assignedTo?: string
  ): Promise<Lead> {
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        status,
        ...(assignedTo && { assignedTo }),
      },
      include: {
        client: true,
        assignedAdmin: true,
      },
    });

    return this.formatLead(lead);
  }

  /**
   * List leads with filters and pagination
   */
  async listLeads(params: LeadFilters): Promise<LeadListResponse> {
    const { status, assignedTo, clientId, page = 1, limit = 20 } = params;

    const where = {
      ...(status && { status }),
      ...(assignedTo && { assignedTo }),
      ...(clientId && { clientId }),
    };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          client: true,
          assignedAdmin: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads: leads.map(lead => this.formatLead(lead)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Convert lead to shipment
   */
  /**
   * Get lead statistics
   */
  async getStats(): Promise<{
    totalLeads: number;
    newLeads: number;
    convertedLeads: number;
  }> {
    const [total, newLeads, converted] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({
        where: { status: LeadStatus.new },
      }),
      this.prisma.lead.count({
        where: { status: LeadStatus.converted },
      }),
    ]);

    return {
      totalLeads: total,
      newLeads,
      convertedLeads: converted,
    };
  }

  /**
   * Update lead details
   */
  async updateLead(
    id: string,
    data: LeadUpdateInput
  ): Promise<Lead> {
    const { weight, ...rest } = data;
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...rest,
        ...(weight !== undefined && { weight: new Decimal(weight) }),
      },
      include: {
        client: true,
        assignedAdmin: true,
      },
    });

    return this.formatLead(lead);
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<void> {
    await this.prisma.lead.delete({
      where: { id },
    });
  }

  async convertToShipment(
    leadId: bigint,
    shipmentData: {
      carrier?: string;
      carrierTrackingNumber?: string;
      estimatedDelivery?: Date;
    }
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        client: true,
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    if (lead.status === LeadStatus.converted) {
      throw new Error('Lead already converted');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create the shipment
      const shipment = await tx.shipment.create({
        data: {
          ...shipmentData,
          userId: lead.clientId?.toString(),  // Convert BigInt to string for UUID field
        },
      });

      // Update lead status
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 'converted',
        },
      });

      return shipment;
    });
  }
}
