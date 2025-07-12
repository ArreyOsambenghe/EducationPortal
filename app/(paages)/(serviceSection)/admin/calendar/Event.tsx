"use client"
import React, { Suspense } from 'react'
import { useCalendarStore } from './calendar.store'
import { useShallow } from 'zustand/shallow'
import EventFetcher from './EventFetcher'

type Props = {
    children:React.ReactNode
}

const Event = ({children}: Props) => {
    const {selectedDate,setShowModal} = useCalendarStore(useShallow(state => ({
        selectedDate: state.selectedDate,
        setShowModal: state.setShowModal
    })))
  return (
    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Schedule & Events</h3>
                        <p className="text-gray-600">
                          {selectedDate ? `Events for ${selectedDate.toDateString()}` : "Select a date to view events"}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Event</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {children}
                    </div>
                  </div>
                </div>
  )
}

export default Event