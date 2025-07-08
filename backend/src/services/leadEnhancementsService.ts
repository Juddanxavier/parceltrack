import { PrismaClient, Lead, LeadComment, LeadAttachment, Notification } from '@prisma/client';

export class LeadEnhancementsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Add a comment to a lead
   */
  async addComment(leadId: bigint, userId: bigint, content: string): Promise<LeadComment> {
    return this.prisma.leadComment.create({
      data: {
        leadId,
        userId,
        content,
      },
    });
  }

  /**
   * Add an attachment to a lead
   */
  async addAttachment(leadId: bigint, userId: bigint, fileData: {
    fileName: string;
    fileSize: number;
    contentType: string;
    path: string;
  }): Promise<LeadAttachment> {
    return this.prisma.leadAttachment.create({
      data: {
        leadId,
        userId,
        ...fileData,
      },
    });
  }

  /**
   * Create a notification for a lead
   */
  async createNotification(userId: bigint, leadId: bigint | null, notificationData: {
    type: string;
    title: string;
    message: string;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId,
        leadId,
        ...notificationData,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: bigint): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId: bigint): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
