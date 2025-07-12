import React from 'react'
import EditButton from './EditButton';
import DeletButton from './DeletButton';
export type Event =
{
    _id: string;
    title: string;
    type: string;
    date: string;
    time: string;
    duration: string;
    room: string;
    description:string
}
type Props = {
    event:Event
    onEdit?: (event: Event) => void;
    onDelete: (id: string) => void
}

const ListEvent = ({event,onEdit,onDelete}: Props) => {
    const getEventTypeColor = (type: string) => {
    switch (type) {
      case "lecture":
        return "bg-blue-100 text-blue-800"
      case "deadline":
        return "bg-red-100 text-red-800"
      case "office-hours":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  return (
    <div
                          key={event._id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {event.type === "lecture" && (
                                <svg
                                  className="w-5 h-5 text-blue-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                  />
                                </svg>
                              )}
                              {event.type === "deadline" && (
                                <svg
                                  className="w-5 h-5 text-red-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                  />
                                </svg>
                              )}
                              {event.type === "office-hours" && (
                                <svg
                                  className="w-5 h-5 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>{event.time}</span>
                                {event.duration && <span>({event.duration})</span>}
                                {event.room && <span>{event.room}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.type)}`}
                            >
                              {event.type.replace("-", " ")}
                            </span>
                            <EditButton event={event} onEdit={onEdit} />
                            <DeletButton id={event._id} onDelete={onDelete}/>
                          </div>
                        </div>
  )
}

export default ListEvent