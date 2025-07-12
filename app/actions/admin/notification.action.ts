'use server'


import prisma from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'


// Validation schemas
const NotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  type: z.enum(['ANNOUNCEMENT', 'ALERT', 'REMINDER', 'SYSTEM', 'ACADEMIC']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  target: z.enum(['ALL', 'STUDENTS', 'TEACHERS', 'STAFF', 'DEPARTMENT']),
  targetDetails: z.string().optional(),
  scheduledFor: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENT', 'FAILED']).default('DRAFT'),
})

const UpdateNotificationSchema = NotificationSchema.partial().extend({
  id: z.string(),
})

// Helper function to get estimated recipients
function getEstimatedRecipients(target: string): number {
  switch (target) {
    case 'ALL':
      return 2100
    case 'STUDENTS':
      return 1800
    case 'TEACHERS':
      return 45
    case 'STAFF':
      return 255
    case 'DEPARTMENT':
      return 25
    default:
      return 0
  }
}

// Helper function to get actual recipients count from database
async function getActualRecipients(target: string, targetDetails?: string): Promise<number> {
  try {
    switch (target) {
      case 'ALL':
        const [studentCount, teacherCount, adminCount] = await Promise.all([
          prisma.student.count({ where: { status: 'active' } }),
          prisma.teacher.count({ where: { status: 'active' } }),
          prisma.admin.count({ where: { status: 'active' } }),
        ])
        return studentCount + teacherCount + adminCount
      
      case 'STUDENTS':
        return await prisma.student.count({ where: { status: 'active' } })
      
      case 'TEACHERS':
        return await prisma.teacher.count({ where: { status: 'active' } })
      
      case 'STAFF':
        return await prisma.admin.count({ where: { status: 'active' } })
      
      case 'DEPARTMENT':
        if (targetDetails) {
          const teacherCount = await prisma.teacher.count({
            where: {
              status: 'active',
              // You might need to adjust this based on your department structure
            }
          })
          return teacherCount
        }
        return 0
      
      default:
        return 0
    }
  } catch (error) {
    console.error('Error getting actual recipients:', error)
    return getEstimatedRecipients(target)
  }
}

export async function createNotification(data: z.infer<typeof NotificationSchema>) {
  try {
    const validatedData = NotificationSchema.parse(data)
    
    const recipients = await getActualRecipients(validatedData.target, validatedData.targetDetails)
    
    const notification = await prisma.notification.create({
      data: {
        ...validatedData,
        createdById: 'current-user-id', // Replace with actual user ID from session
        createdByType: 'admin', // Replace with actual user role from session
        createdBy: 'Admin User', // Replace with actual user name from session
        recipients,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
      },
    })

    // If status is SENT, mark as sent immediately
    if (validatedData.status === 'SENT') {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { 
          sentAt: new Date(),
          status: 'SENT'
        },
      })
    }

    revalidatePath('/admin/notifications')
    return { success: true, data: notification }
  } catch (error) {
    console.error('Error creating notification:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.errors }
    }
    return { success: false, error: 'Failed to create notification' }
  }
}

export async function getNotifications(
  page: number = 1,
  limit: number = 10,
  filters?: {
    search?: string
    type?: string
    status?: string
    target?: string
  }
) {
  try {
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
        { createdBy: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    
    if (filters?.type && filters.type !== 'ALL') {
      where.type = filters.type.toUpperCase()
    }
    
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status.toUpperCase()
    }
    
    if (filters?.target && filters.target !== 'ALL') {
      where.target = filters.target.toUpperCase()
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { readReceipts: true }
          }
        }
      }),
      prisma.notification.count({ where })
    ])

    // Transform the data to match the frontend interface
    const transformedNotifications = notifications.map(notification => ({
      _id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type.toLowerCase(),
      priority: notification.priority.toLowerCase(),
      target: notification.target.toLowerCase(),
      targetDetails: notification.targetDetails,
      createdBy: notification.createdBy,
      createdAt: notification.createdAt.toISOString(),
      scheduledFor: notification.scheduledFor?.toISOString(),
      status: notification.status.toLowerCase(),
      recipients: notification.recipients,
      readCount: notification._count.readReceipts,
    }))

    return {
      success: true,
      data: transformedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

export async function updateNotification(data: z.infer<typeof UpdateNotificationSchema>) {
  try {
    const validatedData = UpdateNotificationSchema.parse(data)
    const { id, ...updateData } = validatedData
    
    // Get current notification
    const currentNotification = await prisma.notification.findUnique({
      where: { id }
    })
    
    if (!currentNotification) {
      return { success: false, error: 'Notification not found' }
    }
    
    // Update recipients if target changed
    let recipients = currentNotification.recipients
    if (updateData.target && updateData.target !== currentNotification.target.toLowerCase()) {
      recipients = await getActualRecipients(updateData.target.toUpperCase(), updateData.targetDetails)
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        ...updateData,
        type: updateData.type?.toUpperCase() as any,
        priority: updateData.priority?.toUpperCase() as any,
        target: updateData.target?.toUpperCase() as any,
        status: updateData.status?.toUpperCase() as any,
        recipients,
        scheduledFor: updateData.scheduledFor ? new Date(updateData.scheduledFor) : undefined,
      },
    })

    revalidatePath('/admin/notifications')
    return { success: true, data: notification }
  } catch (error) {
    console.error('Error updating notification:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.errors }
    }
    return { success: false, error: 'Failed to update notification' }
  }
}

export async function deleteNotification(id: string) {
  try {
    await prisma.notification.delete({
      where: { id }
    })

    revalidatePath('/admin/notifications')
    return { success: true }
  } catch (error) {
    console.error('Error deleting notification:', error)
    return { success: false, error: 'Failed to delete notification' }
  }
}

export async function sendNotification(id: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    if (notification.status === 'SENT') {
      return { success: false, error: 'Notification already sent' }
    }

    // Update notification status to sent
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // Here you would implement the actual sending logic
    // For example, sending emails, push notifications, etc.
    
    revalidatePath('/admin/notifications')
    return { success: true, data: updatedNotification }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

export async function sendNotificationNow(id: string) {
  return sendNotification(id)
}

export async function getNotificationStats() {
  try {
    const [total, sent, scheduled, draft, failed] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'SCHEDULED' } }),
      prisma.notification.count({ where: { status: 'DRAFT' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
    ])

    return {
      success: true,
      data: { total, sent, scheduled, draft, failed }
    }
  } catch (error) {
    console.error('Error fetching notification stats:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string, userType: string, userName: string) {
  try {
    await prisma.notificationReadReceipt.upsert({
      where: {
        notificationId_readerId: {
          notificationId,
          readerId: userId
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        notificationId,
        readerId: userId,
        readerType: userType.toUpperCase() as any,
        readerName: userName,
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: 'Failed to mark as read' }
  }
}

export async function getNotificationById(id: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        readReceipts: {
          orderBy: { readAt: 'desc' },
          take: 10
        },
        _count: {
          select: { readReceipts: true }
        }
      }
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    const transformedNotification = {
      _id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type.toLowerCase(),
      priority: notification.priority.toLowerCase(),
      target: notification.target.toLowerCase(),
      targetDetails: notification.targetDetails,
      createdBy: notification.createdBy,
      createdAt: notification.createdAt.toISOString(),
      scheduledFor: notification.scheduledFor?.toISOString(),
      status: notification.status.toLowerCase(),
      recipients: notification.recipients,
      readCount: notification._count.readReceipts,
      readReceipts: notification.readReceipts,
    }

    return { success: true, data: transformedNotification }
  } catch (error) {
    console.error('Error fetching notification:', error)
    return { success: false, error: 'Failed to fetch notification' }
  }
}
