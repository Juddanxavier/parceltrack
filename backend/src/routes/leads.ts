import { Router } from 'express';
import { PrismaClient, LeadStatus } from '@prisma/client';
import { LeadService } from '../services/leadService';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { isAuthenticated } from '../lib/auth';
import { isAdmin } from '../middleware/isAdmin';

const COUNTRY_REGEX = /^[A-Z]{2}$/;

const router = Router();
const prisma = new PrismaClient();
const leadService = new LeadService(prisma);

// Schema for creating a lead
const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().max(150),
    phone: z.string().min(1).max(20),
    originCountry: z.string().regex(COUNTRY_REGEX, 'Must be a valid 2-letter country code'),
    destinationCountry: z.string().regex(COUNTRY_REGEX, 'Must be a valid 2-letter country code'),
    parcelType: z.string().min(1).max(100),
    weight: z.number().positive().max(999999.99),
    notes: z.string(),
  }),
});

// Schema for updating lead status
const updateLeadStatusSchema = z.object({
  body: z.object({
    status: z.enum(['new', 'contacted', 'qualified', 'converted', 'rejected']),
    assignedTo: z.string().optional(),
  }),
});

// Schema for converting lead to shipment
const convertToShipmentSchema = z.object({
  body: z.object({
    carrier: z.string().optional(),
    carrierTrackingNumber: z.string().optional(),
    estimatedDelivery: z.string().datetime().optional(),
  }),
});

// Create a new lead (accessible by authenticated users)
router.post(
  '/',
  isAuthenticated,
  validateRequest(createLeadSchema),
  async (req, res) => {
    try {
      const lead = await leadService.createLead({
        ...req.body,
        clientId: req.user?.id,
      });
      res.json(lead);
    } catch (error) {
      console.error('Failed to create lead:', error);
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }
);

// Get lead by ID (accessible by admin or owner)
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const lead = await leadService.getLead(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Check if user is admin or owner
    if (!req.user.isAdmin && lead.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Failed to get lead:', error);
    res.status(500).json({ error: 'Failed to get lead' });
  }
});

// Update lead status (admin only)
router.patch(
  '/:id/status',
  isAuthenticated,
  isAdmin,
  validateRequest(updateLeadStatusSchema),
  async (req, res) => {
    try {
      const { status, assignedTo } = req.body;
      const lead = await leadService.updateLeadStatus(
        req.params.id,
        status as LeadStatus,
        assignedTo
      );
      res.json(lead);
    } catch (error) {
      console.error('Failed to update lead status:', error);
      res.status(500).json({ error: 'Failed to update lead status' });
    }
  }
);

// Update lead details (admin only)
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  validateRequest(createLeadSchema.partial()), // Reuse create schema as partial
  async (req, res) => {
    try {
      const lead = await leadService.updateLead(
        req.params.id,
        req.body
      );
      res.json(lead);
    } catch (error) {
      console.error('Failed to update lead:', error);
      res.status(500).json({ error: 'Failed to update lead' });
    }
  }
);

// Delete lead (admin only)
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      await leadService.deleteLead(req.params.id);
      res.status(204).end();
    } catch (error) {
      console.error('Failed to delete lead:', error);
      res.status(500).json({ error: 'Failed to delete lead' });
    }
  }
);

// Lead statistics
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const stats = await leadService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to get lead statistics:', error);
    res.status(500).json({ error: 'Failed to get lead statistics' });
  }
});

// Convert lead to shipment (admin only)
router.post(
  '/:id/convert',
  isAuthenticated,
  isAdmin,
  validateRequest(convertToShipmentSchema),
  async (req, res) => {
    try {
      const shipment = await leadService.convertToShipment(
        BigInt(req.params.id),
        {
          ...req.body,
          estimatedDelivery: req.body.estimatedDelivery 
            ? new Date(req.body.estimatedDelivery)
            : undefined,
        }
      );
      res.json(shipment);
    } catch (error) {
      console.error('Failed to convert lead:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to convert lead' 
      });
    }
  }
);

// List leads (filtered by user role)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { status, page, limit, assignedTo } = req.query;
    
    const filters: {
      status?: LeadStatus;
      assignedTo?: string;
      clientId?: string;
      page?: number;
      limit?: number;
    } = {
      status: status as LeadStatus | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    // If not admin, only show user's own leads
    if (!req.user.isAdmin) {
      filters.clientId = req.user.id;
    }
    // If admin and assignedTo query param exists
    else if (assignedTo) {
      filters.assignedTo = assignedTo as string;
    }

    const result = await leadService.listLeads(filters);
    res.json(result);
  } catch (error) {
    console.error('Failed to list leads:', error);
    res.status(500).json({ error: 'Failed to list leads' });
  }
});

export default router;
