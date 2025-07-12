"use client"
// import { client } from '@/sanity/lib/client'
import React, { useEffect } from 'react'
import ListEvent, { Event } from './ListEvent'
import { useCalendarStore } from './calendar.store'
import { StringComponents } from 'sanity'
import { useShallow } from 'zustand/shallow'
import EventsModal from './EventsModal'
import { preconnect } from 'react-dom'
import { toast } from 'sonner'

type Props = {
    teacherId:string
}

type EventFetcherType ={
    _id:string,
    title:string,
    eventType:string,
    duration:string,
    location:string,
    time:string,
    description:string,
    instructor:{
        _ref:string,
        _type:string
    },
    
}

const EventFetcher =  ({teacherId}: Props) => {
    
    const [loading,setLoading] = React.useState(false)
    const [event,setEvent] = React.useState<Event[]>([])
    const [delte,setDelte] = React.useState({
        id:"",
        title:"",
        index:-1
    })
    const [editEvent,setEditEvent] = React.useState<Event | undefined>(undefined)
    const {selectedDate,showModal,setShowModal,showDeleteModal,setDeleteModal} = useCalendarStore(useShallow(state => ({
        selectedDate: state.selectedDate,
        showModal: state.showModal,
        setShowModal: state.setShowModal,
        showDeleteModal:state.showDeleteModal,
        setDeleteModal:state.setShowDeleteModal
    })))
    
    const addEvent = (event:Event) => {
        setEvent(prev => [...prev,event])
    }
    const updateEvent = (event:Event) => {
        setEvent(prev => prev.map(evt => evt._id === event._id ? event : evt))
    }
    const deleteEvent = (id:string) => {
        setEvent(prev => prev.filter(evt => evt._id !== id))
    }
    if(loading){
        return <div>Loading...</div>
    }
  return (
    <>
        {
            event.map((evt) => (<ListEvent onDelete={deleteEvent} onEdit={(event) => {setShowModal(true);setEditEvent(event)}} key={evt._id} event={evt} />))
        }
        {
            event.length === 0 && (<div className="text-center">No events found for this month</div>)
        }
        
                 {showModal && (
        <EventsModal teacherId={teacherId} updateEventFunc={updateEvent} Data={editEvent} addEvent={addEvent} onClose={() => setShowModal(false)} />
      )}
      {showDeleteModal.open && (
  <div className="fixed inset-0 flex justify-center items-center   bg-black/10  ">
    <div className="bg-white rounded-lg shadow-lg translate-x-6 p-6 w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
      <p className="mb-6">Are you sure you want to delete <span className='font-semibold'>{event.find(item => item._id === showDeleteModal.id)?.title?.toString()}</span>?</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setDeleteModal({ open: false, id: '' ,index:-1,loading:false})}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (showDeleteModal.id !== '') {
              setDeleteModal({ open: false, id:showDeleteModal.id ,index:-1,loading:true})
              return
            }
            toast.error("No id found for deletion");
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >

          Delete
        </button>
      </div>
    </div>
  </div>
)}
  
        
    </>
  )
}

export default EventFetcher