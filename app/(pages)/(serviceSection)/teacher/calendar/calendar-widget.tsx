"use client"

import { useState, useEffect } from "react"
import { getUpcomingEvents } from "@/app/actions/teacher/calendar.action"
import { Calendar, Clock, MapPin, AlertCircle } from "lucide-react"
import { $ZodNull } from "zod/v4/core"

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  date: Date
  time: string
  type: "CLASS" | "EXAM" | "ASSIGNMENT" | "ANNOUNCEMENT" | "OFFICE_HOURS" | "HOLIDAY" | "MEETING" | "DEADLINE" | "WORKSHOP" | "SEMINAR"
  priority: "LOW" | "MEDIUM" | "HIGH"
  location: string | null
  duration: number | null // in minutes
  teacherId: string | null
  recurring: "NONE" | "WEEKLY" | "DAILY" | "MONTHLY"
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
  semesterCourseId: string | null
  metadata: any | null
}

const priorityColors = {
  LOW: "border-l-green-500 bg-green-50",
  MEDIUM: "border-l-yellow-500 bg-yellow-50",
  HIGH: "border-l-red-500 bg-red-50",
}

const typeIcons = {
  class: Calendar,
  exam: AlertCircle,
  assignment: Calendar,
  announcement: AlertCircle,
  office_hours: Clock,
  holiday: Calendar,
}

export default function CalendarWidget({ limit = 5 }: { limit?: number }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      const result = await getUpcomingEvents(limit.toString())
      if (result.success) {
        setEvents(result.data || [])
      }
      setLoading(false)
    }
    loadEvents()
  }, [limit])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
        <Calendar className="w-5 h-5 text-gray-500" />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const Icon = typeIcons[event.type.toLowerCase() as keyof typeof typeIcons] || Calendar

            return (
              <div
                key={event.id}
                className={`border-l-4 p-3 rounded-r-md ${priorityColors[event.priority]} hover:shadow-sm transition-shadow cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
                      {/* {event.courseName && <p className="text-xs text-gray-600 truncate">{event.courseName}</p>} */}
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                        <span>{formatDate(event.date.toISOString())}</span>
                        <span>{event.time}</span>
                        {event.location && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                      event.priority === "HIGH"
                        ? "bg-red-100 text-red-800"
                        : event.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {event.priority}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <a href="/teacher/calendar" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View full calendar →
        </a>
      </div>
    </div>
  )
}
