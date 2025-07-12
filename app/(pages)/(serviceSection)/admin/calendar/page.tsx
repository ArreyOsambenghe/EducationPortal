import React, { Suspense } from 'react'
import CalendarCmp from './calendarCmp'
import Event from './Event'
import EventFetcher from './EventFetcher'

type Props = {
}



const getMonthName = (monthNumber: number) => {
  const date = new Date()
  date.setMonth(monthNumber - 1)
  return date.toLocaleString('en-US', { month: 'long' })
}
const page = async ({}: Props) => {
  // const session = await verifySession() as {email:string,userRole:UserRole};
  //         if(!session || !session.email) redirect('/component/auth/login')
  //         const teacherId = await client.fetch(`*[_type == "teacher" && email == "${session.email}"][0]._id`).then((data:string) => {return data}).catch(err => {return null})
  //         if(!teacherId) redirect('/component/auth/login')
  // Handlers to navigate months
  // const handlePrevMonth = () => {
  //   const prevMonth = new Date(year, month - 1, 1);
  //   setCurrentDate(prevMonth);
  // };

  // const handleNextMonth = () => {
  //   const nextMonth = new Date(year, month + 1, 1);
  //   setCurrentDate(nextMonth);
  // };

  

  return (
    <>

            <div className="space-y-6 mx-2 my-2 relative">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                
                <CalendarCmp />
                {/* Events and Schedule */}
                <Event>
                   <EventFetcher teacherId={''} />
                </Event>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Attendance Tracking</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">Mark attendance for today's classes</p>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Take Attendance</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Grade Management</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">Enter and manage student grades</p>
                    <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span>Enter Grades</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Communication</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">Send announcements to students</p>
                    <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Send Message</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
    </>
  )
}

export default page