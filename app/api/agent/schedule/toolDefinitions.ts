import { FunctionDeclaration, Tool, SchemaType } from '@google/generative-ai';

// --- Tool Definitions for Calendar Actions ---
// Each FunctionDeclaration mirrors an async action in your calendar actions.

const getCalendarEventsFn: FunctionDeclaration = {
  name: 'getCalendarEvents',
  description: 'Retrieves all calendar events, optionally filtered by teacher ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      teacherId: { type: SchemaType.STRING, description: 'Optional teacher ID to filter events.' },
    },
    required: [],
  },
};

const createCalendarEventFn: FunctionDeclaration = {
  name: 'createCalendarEvent',
  description: 'Creates a new calendar event.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: 'Event title.' },
      description: { type: SchemaType.STRING, description: 'Optional event description.' },
      date: { type: SchemaType.STRING, description: 'Event date in ISO format.' },
      time: { type: SchemaType.STRING, description: 'Event time (e.g., "09:00").' },
      type: { 
        type: SchemaType.STRING, 
        description: 'Event type.',
        format: 'enum',
        enum: ['CLASS', 'EXAM', 'ASSIGNMENT', 'ANNOUNCEMENT', 'OFFICE_HOURS', 'HOLIDAY', 'MEETING', 'DEADLINE', 'WORKSHOP', 'SEMINAR']
      },
      priority: { 
        type: SchemaType.STRING, 
        description: 'Event priority.',
        format: 'enum',
        enum: ['LOW', 'MEDIUM', 'HIGH']
      },
      location: { type: SchemaType.STRING, description: 'Optional event location.' },
      duration: { type: SchemaType.NUMBER, description: 'Optional event duration in minutes.' },
      recurring: { 
        type: SchemaType.STRING, 
        description: 'Recurring pattern.',
        format: 'enum',
        enum: ['NONE', 'WEEKLY', 'DAILY', 'MONTHLY']
      },
      status: { 
        type: SchemaType.STRING, 
        description: 'Event status.',
        format: 'enum',
        enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']
      },
      teacherId: { type: SchemaType.STRING, description: 'Optional teacher ID.' },
      semesterCourseId: { type: SchemaType.STRING, description: 'Optional semester course ID.' },
      metadata: { type: SchemaType.STRING, description: 'Optional metadata as JSON string.' },
    },
    required: ['title', 'date', 'time', 'type', 'priority'],
  },
};

const updateCalendarEventFn: FunctionDeclaration = {
  name: 'updateCalendarEvent',
  description: 'Updates an existing calendar event by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      eventId: { type: SchemaType.STRING, description: 'Event ID to update.' },
      title: { type: SchemaType.STRING, description: 'New event title.' },
      description: { type: SchemaType.STRING, description: 'New event description.' },
      date: { type: SchemaType.STRING, description: 'New event date in ISO format.' },
      time: { type: SchemaType.STRING, description: 'New event time.' },
      type: { 
        type: SchemaType.STRING, 
        description: 'New event type.',
        format: 'enum',
        enum: ['CLASS', 'EXAM', 'ASSIGNMENT', 'ANNOUNCEMENT', 'OFFICE_HOURS', 'HOLIDAY', 'MEETING', 'DEADLINE', 'WORKSHOP', 'SEMINAR']
      },
      priority: { 
        type: SchemaType.STRING, 
        description: 'New event priority.',
        format: 'enum',
        enum: ['LOW', 'MEDIUM', 'HIGH']
      },
      location: { type: SchemaType.STRING, description: 'New event location.' },
      duration: { type: SchemaType.NUMBER, description: 'New event duration in minutes.' },
      recurring: { 
        type: SchemaType.STRING, 
        description: 'New recurring pattern.',
        format: 'enum',
        enum: ['NONE', 'WEEKLY', 'DAILY', 'MONTHLY']
      },
      status: { 
        type: SchemaType.STRING, 
        description: 'New event status.',
        format: 'enum',
        enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']
      },
      teacherId: { type: SchemaType.STRING, description: 'New teacher ID.' },
      semesterCourseId: { type: SchemaType.STRING, description: 'New semester course ID.' },
      metadata: { type: SchemaType.STRING, description: 'New metadata as JSON string.' },
    },
    required: ['eventId'],
  },
};

const deleteCalendarEventFn: FunctionDeclaration = {
  name: 'deleteCalendarEvent',
  description: 'Deletes a calendar event by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: { 
      eventId: { type: SchemaType.STRING, description: 'Event ID to delete.' } 
    },
    required: ['eventId'],
  },
};

const getUpcomingEventsFn: FunctionDeclaration = {
  name: 'getUpcomingEvents',
  description: 'Retrieves upcoming events, optionally filtered by teacher ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      teacherId: { type: SchemaType.STRING, description: 'Optional teacher ID to filter events.' },
      limit: { type: SchemaType.NUMBER, description: 'Optional limit for number of events (default: 10).' },
    },
    required: [],
  },
};

const markEventAsCompletedFn: FunctionDeclaration = {
  name: 'markEventAsCompleted',
  description: 'Marks a calendar event as completed.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: { 
      eventId: { type: SchemaType.STRING, description: 'Event ID to mark as completed.' } 
    },
    required: ['eventId'],
  },
};

const getEventsByDateRangeFn: FunctionDeclaration = {
  name: 'getEventsByDateRange',
  description: 'Retrieves events within a specific date range.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      startDate: { type: SchemaType.STRING, description: 'Start date in ISO format.' },
      endDate: { type: SchemaType.STRING, description: 'End date in ISO format.' },
      teacherId: { type: SchemaType.STRING, description: 'Optional teacher ID to filter events.' },
    },
    required: ['startDate', 'endDate'],
  },
};

const getEventsByCourseFn: FunctionDeclaration = {
  name: 'getEventsByCourse',
  description: 'Retrieves events for a specific semester course.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      semesterCourseId: { type: SchemaType.STRING, description: 'Semester course ID.' },
    },
    required: ['semesterCourseId'],
  },
};

const bulkCreateEventsFn: FunctionDeclaration = {
  name: 'bulkCreateEvents',
  description: 'Creates multiple calendar events in bulk.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      events: { 
        type: SchemaType.ARRAY, 
        description: 'Array of event objects to create.',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: 'Event title.' },
            description: { type: SchemaType.STRING, description: 'Optional event description.' },
            date: { type: SchemaType.STRING, description: 'Event date in ISO format.' },
            time: { type: SchemaType.STRING, description: 'Event time.' },
            type: { 
              type: SchemaType.STRING, 
              description: 'Event type.',
              format:'enum',
              enum: ['CLASS', 'EXAM', 'ASSIGNMENT', 'ANNOUNCEMENT', 'OFFICE_HOURS', 'HOLIDAY', 'MEETING', 'DEADLINE', 'WORKSHOP', 'SEMINAR']
            },
            priority: { 
              type: SchemaType.STRING, 
              description: 'Event priority.',
              format:'enum',
              enum: ['LOW', 'MEDIUM', 'HIGH']
            },
            location: { type: SchemaType.STRING, description: 'Optional event location.' },
            duration: { type: SchemaType.NUMBER, description: 'Optional event duration in minutes.' },
            
            recurring: { 
              type: SchemaType.STRING, 
              description: 'Recurring pattern.',
                format: 'enum',
              enum: ['NONE', 'WEEKLY', 'DAILY', 'MONTHLY']
            },
            status: { 
              type: SchemaType.STRING, 
              description: 'Event status.',
                format: 'enum',
              enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']
            },
            teacherId: { type: SchemaType.STRING, description: 'Optional teacher ID.' },
            semesterCourseId: { type: SchemaType.STRING, description: 'Optional semester course ID.' },
            metadata: { type: SchemaType.STRING, description: 'Optional metadata as JSON string.' },
          },
          required: ['title', 'date', 'time', 'type', 'priority'],
        }
      },
    },
    required: ['events'],
  },
};

const getFilteredCalendarEventsFn: FunctionDeclaration = {
  name: 'getFilteredCalendarEvents',
  description: 'Retrieves calendar events with multiple filter options.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      teacherId: { type: SchemaType.STRING, description: 'Optional teacher ID filter.' },
      semesterCourseId: { type: SchemaType.STRING, description: 'Optional semester course ID filter.' },
      type: { 
        type: SchemaType.STRING, 
        description: 'Optional event type filter.',
        format: 'enum',
        enum: ['CLASS', 'EXAM', 'ASSIGNMENT', 'ANNOUNCEMENT', 'OFFICE_HOURS', 'HOLIDAY', 'MEETING', 'DEADLINE', 'WORKSHOP', 'SEMINAR']
      },
      status: { 
        type: SchemaType.STRING, 
        description: 'Optional event status filter.',
        format: 'enum',
        enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']
      },
      priority: { 
        type: SchemaType.STRING, 
        description: 'Optional event priority filter.',
        format: 'enum',
        enum: ['LOW', 'MEDIUM', 'HIGH']
      },
      startDate: { type: SchemaType.STRING, description: 'Optional start date filter in ISO format.' },
      endDate: { type: SchemaType.STRING, description: 'Optional end date filter in ISO format.' },
    },
    required: [],
  },
};

// Export calendar tools array
export const tools: Tool[] = [
  { functionDeclarations: [getCalendarEventsFn] },
  { functionDeclarations: [createCalendarEventFn] },
  { functionDeclarations: [updateCalendarEventFn] },
  { functionDeclarations: [deleteCalendarEventFn] },
  { functionDeclarations: [getUpcomingEventsFn] },
  { functionDeclarations: [markEventAsCompletedFn] },
  { functionDeclarations: [getEventsByDateRangeFn] },
  { functionDeclarations: [getEventsByCourseFn] },
  { functionDeclarations: [bulkCreateEventsFn] },
  { functionDeclarations: [getFilteredCalendarEventsFn] },
];

// Import calendar actions
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getUpcomingEvents,
  markEventAsCompleted,
  getEventsByDateRange,
  getEventsByCourse,
  bulkCreateEvents,
  getFilteredCalendarEvents,
} from '@/app/actions/teacher/calendar.action';

import { ActionResult } from '@/app/actions/base-actions';

/**
 * Central handler to execute calendar actions based on function name.
 * Uses a switch to route the call to the correct function.
 */
export async function handleAction(
  name: string,
  args: Record<string, any>
): Promise<ActionResult<any> | any> {
  switch (name) {
    case 'getCalendarEvents':
      return await getCalendarEvents(args.teacherId);

    case 'createCalendarEvent':
      return await createCalendarEvent({
        title: args.title,
        description: args.description,
        date: new Date(args.date),
        time: args.time,
        type: args.type,
        priority: args.priority,
        location: args.location,
        duration: args.duration,
        recurring: args.recurring || 'NONE',
        status: args.status || 'SCHEDULED',
        teacherId: args.teacherId,
        semesterCourseId: args.semesterCourseId,
        metadata: args.metadata ? JSON.parse(args.metadata) : undefined,
      });

    case 'updateCalendarEvent':
      const updateData: any = {};
      if (args.title) updateData.title = args.title;
      if (args.description) updateData.description = args.description;
      if (args.date) updateData.date = new Date(args.date);
      if (args.time) updateData.time = args.time;
      if (args.type) updateData.type = args.type;
      if (args.priority) updateData.priority = args.priority;
      if (args.location) updateData.location = args.location;
      if (args.duration) updateData.duration = args.duration;
      if (args.recurring) updateData.recurring = args.recurring;
      if (args.status) updateData.status = args.status;
      if (args.teacherId) updateData.teacherId = args.teacherId;
      if (args.semesterCourseId) updateData.semesterCourseId = args.semesterCourseId;
      if (args.metadata) updateData.metadata = JSON.parse(args.metadata);
      
      return await updateCalendarEvent(args.eventId, updateData);

    case 'deleteCalendarEvent':
      return await deleteCalendarEvent(args.eventId);

    case 'getUpcomingEvents':
      return await getUpcomingEvents(args.teacherId, args.limit);

    case 'markEventAsCompleted':
      return await markEventAsCompleted(args.eventId);

    case 'getEventsByDateRange':
      return await getEventsByDateRange(args.startDate, args.endDate, args.teacherId);

    case 'getEventsByCourse':
      return await getEventsByCourse(args.semesterCourseId);

    case 'bulkCreateEvents':
      const eventsData = args.events.map((event: any) => ({
        title: event.title,
        description: event.description,
        date: new Date(event.date),
        time: event.time,
        type: event.type,
        priority: event.priority,
        location: event.location,
        duration: event.duration,
        recurring: event.recurring || 'NONE',
        status: event.status || 'SCHEDULED',
        teacherId: event.teacherId,
        semesterCourseId: event.semesterCourseId,
        metadata: event.metadata ? JSON.parse(event.metadata) : undefined,
      }));
      return await bulkCreateEvents(eventsData);

    case 'getFilteredCalendarEvents':
      const filters: any = {};
      if (args.teacherId) filters.teacherId = args.teacherId;
      if (args.semesterCourseId) filters.semesterCourseId = args.semesterCourseId;
      if (args.type) filters.type = args.type;
      if (args.status) filters.status = args.status;
      if (args.priority) filters.priority = args.priority;
      if (args.startDate) filters.startDate = new Date(args.startDate);
      if (args.endDate) filters.endDate = new Date(args.endDate);
      
      return await getFilteredCalendarEvents(filters);

    default:
      throw new Error(`Unknown calendar action: ${name}`);
  }
}