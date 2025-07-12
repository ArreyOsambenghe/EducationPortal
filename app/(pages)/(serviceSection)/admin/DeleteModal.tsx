"use client"

import { useState } from "react"
import { X } from "lucide-react"


type Props = {
    _id:string,
    onDelete: (id: string) => void
    documentName:string
    open: boolean
    onClose: () => void
}
export default function DeleteModal({
    _id,
    onDelete,
    documentName,
    open,
    onClose
}:Props) {

  if (!open) return null

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/10 flex w-full items-center justify-center ">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Delete document?</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-sm hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{documentName}"</span>?
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 pt-0">
              <button
                onClick={() => onClose()}
                className="px-4 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log(`Deleting document: ${documentName}`)
                  onDelete(_id)
                  onClose()
                }}
                className="px-4 py-1 cursor-pointer text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
