"use server"

import prisma from "@/app/lib/prisma"
import { revalidatePath } from "next/cache"

// Types matching the Prisma schema
type CalendarEvent = {
  id: string
  title: string
  description?: string
  date: Date
  time: string
  type: "CLASS" | "EXAM" | "ASSIGNMENT" | "ANNOUNCEMENT" | "OFFICE_HOURS" | "HOLIDAY" | "MEETING" | "DEADLINE" | "WORKSHOP" | "SEMINAR"
  priority: "LOW" | "MEDIUM" | "HIGH"
  location?: string
  duration?: number
  recurring: "NONE" | "WEEKLY" | "DAILY" | "MONTHLY"
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
  teacherId?: string
  semesterCourseId?: string
  metadata?: any
}

// Get all calendar events
export async function getCalendarEvents(teacherId?: string) {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: teacherId ? { teacherId } : {},
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        semesterCourse: {
          select: {
            id: true,
            semester: true,
            room: true,
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return {
      success: true,
      data: events,
    }
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return {
      success: false,
      error: "Failed to fetch calendar events",
    }
  }
}

// Create a new calendar event
export async function createCalendarEvent(eventData: Omit<CalendarEvent, "id">) {
  try {
    const newEvent = await prisma.calendarEvent.create({
      data: {
        ...eventData,
        date: new Date(eventData.date),
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        semesterCourse: {
          select: {
            id: true,
            semester: true,
            room: true,
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
    })

    // If the event is a class and linked to a semester course, update the schedule
    if (eventData.type === "CLASS" && eventData.semesterCourseId) {
      await updateSemesterCourseSchedule(eventData.semesterCourseId, {
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        duration: eventData.duration
      })
    }

    revalidatePath("/teacher/calendar")
    revalidatePath("/teacher/courses")

    return {
      success: true,
      data: newEvent,
    }
  } catch (error) {
    console.error("Error creating calendar event:", error)
    return {
      success: false,
      error: "Failed to create calendar event",
    }
  }
}

// Update an existing calendar event
export async function updateCalendarEvent(eventId: string, eventData: Partial<CalendarEvent>) {
  try {
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...eventData,
        date: eventData.date ? new Date(eventData.date) : undefined,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        semesterCourse: {
          select: {
            id: true,
            semester: true,
            room: true,
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
    })

    // If the event is a class and linked to a semester course, update the schedule
    if (eventData.type === "CLASS" && updatedEvent.semesterCourseId) {
      await updateSemesterCourseSchedule(updatedEvent.semesterCourseId, {
        date: updatedEvent.date,
        time: updatedEvent.time,
      })
    }

    revalidatePath("/teacher/calendar")
    revalidatePath("/teacher/courses")

    return {
      success: true,
      data: updatedEvent,
    }
  } catch (error) {
    console.error("Error updating calendar event:", error)
    return {
      success: false,
      error: "Failed to update calendar event",
    }
  }
}

// Delete a calendar event
export async function deleteCalendarEvent(eventId: string) {
  try {
    await prisma.calendarEvent.delete({
      where: { id: eventId }
    })

    revalidatePath("/teacher/calendar")
    revalidatePath("/teacher/courses")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return {
      success: false,
      error: "Failed to delete calendar event",
    }
  }
}

// Get upcoming events
export async function getUpcomingEvents(teacherId?: string, limit = 10) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: today
        },
        status: "SCHEDULED",
        ...(teacherId && { teacherId })
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        semesterCourse: {
          select: {
            id: true,
            semester: true,
            room: true,
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: limit
    })

    return {
      success: true,
      data: upcomingEvents,
    }
  } catch (error) {
    console.error("Error fetching upcoming events:", error)
    return {
      success: false,
      error: "Failed to fetch upcoming events",
    }
  }
}

// Mark event as completed
export async function markEventAsCompleted(eventId: string) {
  try {
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: { status: "COMPLETED" },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        semesterCourse: {
          select: {
            id: true,
            semester: true,
            room: true,
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
    })

    revalidatePath("/teacher/calendar")

    return {
      success: true,
      data: updatedEvent,
    }
  } catch (error) {
    console.error("Error marking event as completed:", error)
    return {
      success: false,
      error: "Failed to mark event as completed",
    }
  }
}

// Get events by date range
export async function getEventsByDateRange(
  startDate: string, 
  endDate: string, 
  teacherId?: string
) {
  try {
    const eventsInRange = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        ...(teacherId && { teacherId })
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        semesterCourse: {
          select: {
            id: true,
            semester: true,
            room: true,
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return {
      success: true,
      data: eventsInRange,
    }
  } catch (error) {
    console.error("Error fetching events by date range:", error)
    return {
      success: false,
      error: "Failed to fetch events by date range",
    }
  }
}

// Get events by course
export async function getEventsByCourse(semesterCourseId: string) {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: {
        semesterCourseId
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        semesterCourse: {
          select: {
            id: true,
            semester: true,
            room: true,
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return {
      success: true,
      data: events,
    }
  } catch (error) {
    console.error("Error fetching events by course:", error)
    return {
      success: false,
      error: "Failed to fetch events by course",
    }
  }
}

// Helper function to update semester course schedule
async function updateSemesterCourseSchedule(
  semesterCourseId: string,
  scheduleData: {
    date: Date
    time: string
    location?: string
    duration?: number
  }
) {
  try {
    // Create a formatted schedule string
    const scheduleString = `${scheduleData.date.toDateString()} at ${scheduleData.time}${
      scheduleData.location ? ` in ${scheduleData.location}` : ''
    }${scheduleData.duration ? ` (${scheduleData.duration} minutes)` : ''}`

    await prisma.semesterCourse.update({
      where: { id: semesterCourseId },
      data: {
        schedule: scheduleString,
        room: scheduleData.location || undefined
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating semester course schedule:", error)
    return { success: false, error: "Failed to update course schedule" }
  }
}

// Bulk create events (useful for recurring events or importing schedules)
export async function bulkCreateEvents(
  events: Omit<CalendarEvent, "id">[]
) {
  try {
    const createdEvents = await prisma.calendarEvent.createMany({
      data: events.map(event => ({
        ...event,
        date: new Date(event.date)
      })),
      skipDuplicates: true
    })

    revalidatePath("/teacher/calendar")
    revalidatePath("/teacher/courses")

    return {
      success: true,
      data: createdEvents,
    }
  } catch (error) {
    console.error("Error bulk creating events:", error)
    return {
      success: false,
      error: "Failed to create events",
    }
  }
}

// Get calendar events with filters
export async function getFilteredCalendarEvents(filters: {
  teacherId?: string
  semesterCourseId?: string
  type?: CalendarEvent["type"]
  status?: CalendarEvent["status"]
  startDate?: Date
  endDate?: Date
  priority?: CalendarEvent["priority"]
}) {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: {
        ...(filters.teacherId && { teacherId: filters.teacherId }),
        ...(filters.semesterCourseId && { semesterCourseId: filters.semesterCourseId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.startDate && filters.endDate && {
          date: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        })
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        semesterCourse: {
          select: {
            id: true,
            semester: true,
            room: true,
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return {
      success: true,
      data: events,
    }
  } catch (error) {
    console.error("Error fetching filtered calendar events:", error)
    return {
      success: false,
      error: "Failed to fetch filtered calendar events",
    }
  }
}