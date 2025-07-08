import { Router } from 'express';
import { PrismaClient, TrackingStatus } from '@prisma/client';
import { TrackingService } from '../services/trackingService';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const prisma = new PrismaClient();
const trackingService = new TrackingService(prisma);

// Schema for creating a shipment
const createShipmentSchema = z.object({
  body: z.object({
    userId: z.string().optional(),
    carrier: z.string().optional(),
    carrierTrackingNumber: z.string().optional(),
    estimatedDelivery: z.string().datetime().optional(),
  }),
});

// Schema for updating shipment status
const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'PENDING',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'EXCEPTION',
      'RETURNED',
    ]),
    description: z.string(),
    location: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  }),
});

// Create a new shipment
router.post(
  '/shipments',
  validateRequest(createShipmentSchema),
  async (req, res) => {
    try {
      const shipment = await trackingService.createShipment({
        ...req.body,
        estimatedDelivery: req.body.estimatedDelivery 
          ? new Date(req.body.estimatedDelivery)
          : undefined,
      });
      res.json(shipment);
    } catch (error) {
      console.error('Failed to create shipment:', error);
      res.status(500).json({ error: 'Failed to create shipment' });
    }
  }
);

// Get shipment by tracking number
router.get('/shipments/:trackingNumber', async (req, res) => {
  try {
    const shipment = await trackingService.getShipment(req.params.trackingNumber);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (error) {
    console.error('Failed to get shipment:', error);
    res.status(500).json({ error: 'Failed to get shipment' });
  }
});

// Update shipment status
router.post(
  '/shipments/:trackingNumber/status',
  validateRequest(updateStatusSchema),
  async (req, res) => {
    try {
      const { status, description, location, timestamp } = req.body;
      const shipment = await trackingService.updateShipmentStatus(
        req.params.trackingNumber,
        status as TrackingStatus,
        {
          description,
          location,
          timestamp: timestamp ? new Date(timestamp) : undefined,
        }
      );
      res.json(shipment);
    } catch (error) {
      console.error('Failed to update shipment status:', error);
      res.status(500).json({ error: 'Failed to update shipment status' });
    }
  }
);

// List shipments with filters
router.get('/shipments', async (req, res) => {
  try {
    const { userId, status, page, limit } = req.query;
    const result = await trackingService.listShipments({
      userId: userId as string | undefined,
      status: status as TrackingStatus | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('Failed to list shipments:', error);
    res.status(500).json({ error: 'Failed to list shipments' });
  }
});

export default router;
