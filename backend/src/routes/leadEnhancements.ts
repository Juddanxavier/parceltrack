import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { LeadEnhancementsService } from '../services/leadEnhancementsService';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { isAuthenticated } from '../lib/auth';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();
const leadEnhancementsService = new LeadEnhancementsService(prisma);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/lead-attachments',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Schema for adding a comment
const addCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(10000),
  }),
});

// Add comment to lead
router.post(
  '/leads/:id/comments',
  isAuthenticated,
  validateRequest(addCommentSchema),
  async (req, res) => {
    try {
      const leadId = BigInt(req.params.id);
      const userId = BigInt(req.user.id);
      const { content } = req.body;

      const comment = await leadEnhancementsService.addComment(
        leadId,
        userId,
        content
      );

      // Create notification for lead owner if comment is from admin
      if (req.user.isAdmin) {
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { clientId: true },
        });

        if (lead?.clientId) {
          await leadEnhancementsService.createNotification(
            lead.clientId,
            leadId,
            {
              type: 'LEAD_COMMENT',
              title: 'New comment on your lead',
              message: `An admin has commented on your lead.`,
            }
          );
        }
      }

      res.json(comment);
    } catch (error) {
      console.error('Failed to add comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
);

// Add attachment to lead
router.post(
  '/leads/:id/attachments',
  isAuthenticated,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const leadId = BigInt(req.params.id);
      const userId = BigInt(req.user.id);

      const attachment = await leadEnhancementsService.addAttachment(
        leadId,
        userId,
        {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          contentType: req.file.mimetype,
          path: req.file.path,
        }
      );

      // Create notification for lead owner if attachment is from admin
      if (req.user.isAdmin) {
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { clientId: true },
        });

        if (lead?.clientId) {
          await leadEnhancementsService.createNotification(
            lead.clientId,
            leadId,
            {
              type: 'LEAD_ATTACHMENT',
              title: 'New attachment on your lead',
              message: `An admin has added a file to your lead.`,
            }
          );
        }
      }

      res.json(attachment);
    } catch (error) {
      console.error('Failed to add attachment:', error);
      res.status(500).json({ error: 'Failed to add attachment' });
    }
  }
);

// Get notifications for current user
router.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const notifications = await leadEnhancementsService.getUserNotifications(
      userId
    );
    res.json(notifications);
  } catch (error) {
    console.error('Failed to get notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.post(
  '/notifications/:id/read',
  isAuthenticated,
  async (req, res) => {
    try {
      const notificationId = BigInt(req.params.id);

      // Verify notification belongs to user
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      if (notification.userId !== BigInt(req.user.id)) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updatedNotification = await leadEnhancementsService.markNotificationAsRead(
        notificationId
      );
      res.json(updatedNotification);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }
);

export default router;
