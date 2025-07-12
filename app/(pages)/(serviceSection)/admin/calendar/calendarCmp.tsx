"use client"
import React, { useState } from 'react'
import { useCalendarStore } from './calendar.store';
import { useShallow } from 'zustand/shallow';

type Props = {}

const CalendarCmp = (props: Props) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const {selectedDate,setSelectedDate} = useCalendarStore(useShallow(state => ({
        selectedDate: state.selectedDate,
        setSelectedDate: state.setSelectedDate
    })))
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-indexed (0 = Jan)
    
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
    
      // Figure out what day of the week the first day lands on (0 = Sunday)
      const startDay = firstDayOfMonth.getDay();
    
      // Build the days array
      const days = [];
      for (let i = 0; i < startDay; i++) {
        days.push(null); // Empty cell
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
  return (
    <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar</h3>
                    <p className="text-gray-600 mb-4">Select a date to view events</p>
                  </div>
                  <div className="p-6">
                    <div className="text-center">

                        <div className="text-sm text-gray-600 mb-2">{ currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                          return (
                            <button
                              onClick={()=>{
                                if(selectedDate && day){
                                  setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
                                }else if(day && !selectedDate){
                                  setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                                }
                              }}
                                key={i}
                              className={`h-8 w-8 text-sm rounded ${
                                true
                                  ? (selectedDate && day && selectedDate.getDate() === day) || day === currentDate.getDate() && !selectedDate
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-900 hover:bg-gray-100"
                                  : "text-gray-300"
                              }`}
                            >
                            {day && day }
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
  )
}

export default CalendarCmp