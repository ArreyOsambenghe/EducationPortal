import React, { useEffect } from 'react'
import { Event } from './ListEvent'
import { toast } from 'sonner'
import { Loader } from 'lucide-react'


type Props = {
    onClose: () => void
    teacherId:string
    addEvent: (event: Event) => void
    updateEventFunc?: (event: Event) => void
    Data?:Event
}

const EventsModal = ({onClose,teacherId,addEvent,updateEventFunc,Data}: Props) => {
    const [event, setEvent] = React.useState<Event & {description:string}>( {
      title:'',
      type: '',
      date: '',
      time: '',
      duration: '',
      room: '',
      description:'',
      _id:''
    })
    useEffect(() => {
      console.log(Data)
      if(Data){
        setEvent(Data)
      }
    },[Data])

    const [loading,setLoading] = React.useState(false)
    const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

};


  return (
    <div className="fixed inset-1 bg-black/10 flex items-center justify-center   ">
          <div className="relative w-full h-full flex py-10 items-center overflow-y-auto justify-center">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg max-w-md translate-y-[10%] mb-10 w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Add New Event</h2>
                    <p className="text-gray-600">Create a new calendar event</p>
                  </div>
                  <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      placeholder="Enter event title"
                      value={event.title}
                      onChange={(e) => setEvent({...event, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                    value={event.type}
                    onChange={(e) => setEvent({...event, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Select event type</option>
                      <option value={'lecture'}>Lecture</option>
                      <option value={'exam'}>Exam</option>
                      <option value={'deadline'}>Assignment Deadline</option>
                      <option value={'office-hours'}>Office Hours</option>
                      <option value={'meeting'}>Meeting</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                      value={event.date}
                        type="date"
                        onChange={(e) => setEvent({...event, date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        value={event.time}
                        type="time"
                        onChange={(e) => setEvent({...event, time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      value={event.duration}
                      type="text"
                      onChange={(e) => setEvent({...event, duration: e.target.value})}
                      placeholder="Enter room or location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room/Location</label>
                    <input
                      value={event.room}
                      type="text"
                      onChange={(e) => setEvent({...event, room: e.target.value})}
                      placeholder="Enter room or location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={event.description}
                      placeholder="Enter event description"
                      onChange={(e) => setEvent({...event, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                  type='submit' 
                  disabled={loading}
                  className="w-full flex items-center justify-center disabled:bg-green-300 disabled:hover:bg-green-400 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium">
                    {loading && <Loader className='animate-spin  duration-300' size={16}/>}
                    Create Event
                  </button>
                </div>
              </div>
          </form>
          </div>
        </div>
  )
}

export default EventsModal