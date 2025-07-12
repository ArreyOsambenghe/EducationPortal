'use client'


import React, { useEffect } from 'react'
import { useCalendarStore } from './calendar.store'
import { useShallow } from 'zustand/shallow'
import { Loader } from 'lucide-react'

const DeletButton = ({id,onDelete}:{id:string,onDelete:(id:string)=>void}) => {
    const {setShowDeleteModal,showDeleteModal} = useCalendarStore(useShallow(state => ({
        setShowDeleteModal: state.setShowDeleteModal
        ,showDeleteModal:state.showDeleteModal
    })))



  return (
    <button onClick={() => setShowDeleteModal({...showDeleteModal,open:true,id:id})} className="text-gray-400 hover:text-gray-600 p-1">
                              {
                                showDeleteModal.loading && showDeleteModal.id === id ? (
                                    <Loader className='animate-spin duration-300' size={16}/>
                                ):(
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                                )
                              }
                            </button>
  )
}

export default DeletButton