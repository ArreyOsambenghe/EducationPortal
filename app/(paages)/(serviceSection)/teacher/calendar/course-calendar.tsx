"use client"

import { useState, useEffect, useTransition } from "react"
import type React from "react"
import { getCourses } from "@/app/actions/teacher/course.action"
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  getUpcomingEvents,
  getEventsByDateRange,
} from "@/app/actions/teacher/calendar.action"
import { toast } from "sonner"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  GraduationCap,
} from "lucide-react"

// Types matching the Prisma schema from actions
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
  teacher?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  semesterCourse?: {
    id: string
    semester: string
    room: string
    course: {
      name: string
      code: string
    }
  }
}

// Course type (simplified to match what's needed)
type Course = {
  id: string
  name: string
  code: string
  semester: string
  credits: number
  schedule: string
  room: string
  enrolledStudents: number
  status: "active" | "completed" | "upcoming"
  description: string
  syllabus: string[]
  syllabusItems: SyllabusItem[]
  assignments: Assignment[]
  announcements: Announcement[]
  materials: Material[]
  uploads: Upload[]
}

type Assignment = {
  id: string
  title: string
  description: string
  dueDate: string
  totalPoints: number
  submissions: number
  files?: string[]
  status: "active" | "closed" | "draft"
}

type Announcement = {
  id: string
  title: string
  content: string
  date: string
  priority: "low" | "medium" | "high"
}

type SyllabusItem = {
  id: string
  week: number
  title: string
  description: string
  topics: string[]
  readings: string[]
  assignments: string[]
  notes: string
}

type Material = {
  id: string
  title: string
  description: string
  type: "file" | "link" | "video" | "document"
  category: string
  url: string
  fileName?: string
  fileSize?: string
  uploadDate: string
  isVisible: boolean
  downloadCount: number
}

type Upload = {
  id: string
  name: string
  fileName: string
  fileSize: string
  uploadDate: string
  fileType: string
  fileUrl: string
}

const eventTypes = [
  { value: "CLASS", label: "Class Session", color: "bg-blue-500", icon: BookOpen },
  { value: "EXAM", label: "Exam", color: "bg-red-500", icon: GraduationCap },
  { value: "ASSIGNMENT", label: "Assignment Due", color: "bg-orange-500", icon: Calendar },
  { value: "ANNOUNCEMENT", label: "Announcement", color: "bg-purple-500", icon: AlertCircle },
  { value: "OFFICE_HOURS", label: "Office Hours", color: "bg-green-500", icon: Clock },
  { value: "HOLIDAY", label: "Holiday", color: "bg-gray-500", icon: Calendar },
  { value: "MEETING", label: "Meeting", color: "bg-indigo-500", icon: Calendar },
  { value: "DEADLINE", label: "Deadline", color: "bg-red-600", icon: AlertCircle },
  { value: "WORKSHOP", label: "Workshop", color: "bg-teal-500", icon: BookOpen },
  { value: "SEMINAR", label: "Seminar", color: "bg-purple-600", icon: GraduationCap },
]

const priorityColors = {
  LOW: "border-l-green-500",
  MEDIUM: "border-l-yellow-500",
  HIGH: "border-l-red-500",
}

export default function CourseCalendar() {
  const [courses, setCourses] = useState<Course[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [isPending, startTransition] = useTransition()
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])

  // Load courses and events
  useEffect(() => {
    const loadData = async () => {
      startTransition(async () => {
        try {
          const [coursesResult, eventsResult, upcomingResult] = await Promise.all([
            getCourses(),
            getCalendarEvents(),
            getUpcomingEvents(undefined, 5)
          ])

          if (coursesResult.success && coursesResult.data) {
            setCourses(coursesResult.data)
          }

          if (eventsResult.success && eventsResult.data) {
            setEvents(
              eventsResult.data.map((event: any) => ({
                ...event,
                description: event.description === null ? undefined : event.description,
                location: event.location === null ? undefined : event.location,
                duration: event.duration === null ? undefined : event.duration,
              }))
            )
          }

          if (upcomingResult.success && upcomingResult.data) {
            setUpcomingEvents(
              upcomingResult.data.map((event: any) => ({
                ...event,
                description: event.description === null ? undefined : event.description,
                location: event.location === null ? undefined : event.location,
                duration: event.duration === null ? undefined : event.duration,
              }))
            )
          }
        } catch (error) {
          console.error("Error loading data:", error)
          toast.error("Failed to load calendar data")
        }
      })
    }
    loadData()
  }, [])

  // Load events for current month when date changes
  useEffect(() => {
    const loadMonthEvents = async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      try {
        const result = await getEventsByDateRange(
          startOfMonth.toISOString(),
          endOfMonth.toISOString()
        )
        
        if (result.success && result.data) {
          setEvents(
            result.data.map((event: any) => ({
              ...event,
              description: event.description === null ? undefined : event.description,
              location: event.location === null ? undefined : event.location,
              duration: event.duration === null ? undefined : event.duration,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading month events:", error)
      }
    }

    loadMonthEvents()
  }, [currentDate])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return events.filter((event) => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date)
      const eventDateString = eventDate.toISOString().split("T")[0]
      const matchesDate = eventDateString === dateString
      const matchesEventFilter = eventFilter === "all" || event.type === eventFilter
      const matchesCourseFilter = courseFilter === "all" || event.semesterCourseId === courseFilter
      return matchesDate && matchesEventFilter && matchesCourseFilter
    })
  }

  const getEventTypeConfig = (type: string) => {
    return eventTypes.find((et) => et.value === type) || eventTypes[0]
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleAddEvent = async (eventData: Omit<CalendarEvent, "id">) => {
    startTransition(async () => {
      try {
        const result = await createCalendarEvent(eventData)
        if (result.success && result.data) {
          setEvents((prev) => [
            ...prev,
            {
              ...result.data,
              description: result.data.description === null ? undefined : result.data.description,
              location: result.data.location === null ? undefined : result.data.location,
              duration: result.data.duration === null ? undefined : result.data.duration,
            } as CalendarEvent,
          ])
          setShowEventModal(false)
          toast.success("Event added successfully")
          
          // Refresh upcoming events
          const upcomingResult = await getUpcomingEvents(undefined, 5)
          if (upcomingResult.success && upcomingResult.data) {
            setUpcomingEvents(
              upcomingResult.data.map((event: any) => ({
                ...event,
                description: event.description === null ? undefined : event.description,
                location: event.location === null ? undefined : event.location,
                duration: event.duration === null ? undefined : event.duration,
              }))
            )
          }
        } else {
          toast.error(result.error || "Failed to add event")
        }
      } catch (error) {
        console.error("Error adding event:", error)
        toast.error("Failed to add event")
      }
    })
  }

  const handleEditEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!editingEvent) return

    startTransition(async () => {
      try {
        const result = await updateCalendarEvent(editingEvent.id, eventData)
        if (result.success && result.data) {
          setEvents((prev) =>
            prev.map((event) =>
              event.id === editingEvent.id
                ? {
                    ...result.data,
                    description:
                      result.data.description === null
                        ? undefined
                        : result.data.description,
                    location:
                      result.data.location === null
                        ? undefined
                        : result.data.location,
                    duration:
                      result.data.duration === null
                        ? undefined
                        : result.data.duration,
                  } as CalendarEvent
                : event
            )
          )
          setEditingEvent(null)
          setShowEventModal(false)
          toast.success("Event updated successfully")
          
          // Refresh upcoming events
          const upcomingResult = await getUpcomingEvents(undefined, 5)
          if (upcomingResult.success && upcomingResult.data) {
            setUpcomingEvents(
              upcomingResult.data.map((event: any) => ({
                ...event,
                description: event.description === null ? undefined : event.description,
                location: event.location === null ? undefined : event.location,
                duration: event.duration === null ? undefined : event.duration,
              }))
            )
          }
        } else {
          toast.error(result.error || "Failed to update event")
        }
      } catch (error) {
        console.error("Error updating event:", error)
        toast.error("Failed to update event")
      }
    })
  }

  const handleDeleteEvent = (eventId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteCalendarEvent(eventId)
        if (result.success) {
          setEvents((prev) => prev.filter((event) => event.id !== eventId))
          setEditingEvent(null)
          setShowEventModal(false)
          toast.success("Event deleted successfully")
          
          // Refresh upcoming events
          const upcomingResult = await getUpcomingEvents(undefined, 5)
          if (upcomingResult.success && upcomingResult.data) {
            setUpcomingEvents(
              upcomingResult.data.map((event: any) => ({
                ...event,
                description: event.description === null ? undefined : event.description,
                location: event.location === null ? undefined : event.location,
                duration: event.duration === null ? undefined : event.duration,
              }))
            )
          }
        } else {
          toast.error(result.error || "Failed to delete event")
        }
      } catch (error) {
        console.error("Error deleting event:", error)
        toast.error("Failed to delete event")
      }
    })
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const days = getDaysInMonth(currentDate)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Calendar</h1>
            <p className="text-gray-600">Manage your course schedule, exams, and important dates</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setEditingEvent(null)
                setShowEventModal(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigateMonth("prev")} className="p-2 hover:bg-gray-100 rounded-md">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={() => navigateMonth("next")} className="p-2 hover:bg-gray-100 rounded-md">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Today
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Events</option>
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, index) => {
              const isToday = day && day.toDateString() === new Date().toDateString()
              const dayEvents = day ? getEventsForDate(day) : []

              return (
                <div
                  key={index}
                  className={`bg-white min-h-[120px] p-2 ${
                    day ? "hover:bg-gray-50 cursor-pointer" : ""
                  } ${isToday ? "bg-blue-50 border-2 border-blue-200" : ""}`}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => {
                          const typeConfig = getEventTypeConfig(event.type)
                          const Icon = typeConfig.icon

                          return (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded border-l-2 ${priorityColors[event.priority]} bg-gray-50 hover:bg-gray-100 cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingEvent(event)
                                setShowEventModal(true)
                              }}
                            >
                              <div className="flex items-center space-x-1">
                                <Icon className="w-3 h-3 text-gray-600" />
                                <span className="truncate font-medium">{event.title}</span>
                              </div>
                              <div className="text-gray-500">{event.time}</div>
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Event Legend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {eventTypes.map((type) => {
              const Icon = type.icon
              return (
                <div key={type.value} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${type.color}`}></div>
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => {
                const typeConfig = getEventTypeConfig(event.type)
                const Icon = typeConfig.icon
                const eventDate = event.date instanceof Date ? event.date : new Date(event.date)

                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 border-l-4 ${priorityColors[event.priority]} bg-gray-50 rounded-r-md hover:bg-gray-100 cursor-pointer`}
                    onClick={() => {
                      setEditingEvent(event)
                      setShowEventModal(true)
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {event.semesterCourse && `${event.semesterCourse.course.code} - ${event.semesterCourse.course.name} • `}
                          {eventDate.toLocaleDateString()} at {event.time}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                )
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
          }}
          onSubmit={editingEvent ? handleEditEvent : handleAddEvent}
          onDelete={editingEvent ? () => handleDeleteEvent(editingEvent.id) : undefined}
          event={editingEvent}
          courses={courses}
          isPending={isPending}
        />
      )}
    </div>
  )
}

// Event Modal Component
function EventModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  event,
  courses,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (event: any) => Promise<void>
  onDelete?: () => void
  event: CalendarEvent | null
  courses: Course[]
  isPending: boolean
}) {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date instanceof Date
      ? event.date.toISOString().split("T")[0]
      : typeof event?.date === "string"
        ? new Date(event.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    time: event?.time || "09:00",
    type: event?.type || ("CLASS" as CalendarEvent["type"]),
    semesterCourseId: event?.semesterCourseId || "",
    priority: event?.priority || ("MEDIUM" as CalendarEvent["priority"]),
    location: event?.location || "",
    duration: event?.duration || 60,
    recurring: event?.recurring || ("NONE" as CalendarEvent["recurring"]),
    status: event?.status || ("SCHEDULED" as CalendarEvent["status"]),
    teacherId: event?.teacherId || "",
    metadata: event?.metadata || null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      date: new Date(formData.date),
      // Only include non-empty values
      semesterCourseId: formData.semesterCourseId || undefined,
      teacherId: formData.teacherId || undefined,
      location: formData.location || undefined,
      duration: formData.duration || undefined,
      description: formData.description || undefined,
    }

    await onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{event ? "Edit Event" : "Add New Event"}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEvent["type"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as CalendarEvent["priority"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                value={formData.semesterCourseId}
                onChange={(e) => setFormData({ ...formData, semesterCourseId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Room number or location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
              >
                Add Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}