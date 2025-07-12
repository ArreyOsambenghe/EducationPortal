import { AIMessage, AISession } from '@/app/generated/prisma'
import { LoaderCircle } from 'lucide-react'
import React from 'react'

type Props = {
    activeId:string|null
    conversations:(AISession & {messages:AIMessage[]})[]
    setActiveId:(id:string|null) => void
    newSessionLoading:boolean
    handleCreation: () => void
}

const Conversation = ({activeId,conversations,setActiveId,newSessionLoading,handleCreation}: Props) => {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* New Conversation */}
      <div className="p-4 border-b">
          {newSessionLoading ? <LoaderCircle size={16} className='animate-spin duration-500'/> : 
          (<>
        <button disabled={newSessionLoading} onClick={handleCreation}  className="w-full flex disabled:opacity-50 items-center gap-2 duration-500 bg-gray-900 hover:scale-105 text-white font-medium py-2 px-4 rounded-md">
          
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Conversation
        </button>
        </>)}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 mx-auto mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.842 9.842 0 01-3.555-.697L3 20l1.738-4.373A7.963 7.963 0 014 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conversation, idx) => {
              return (
                <div
                  key={conversation.id}
                  onClick={() => setActiveId(conversation.id)}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-200 ${
                activeId === conversation.id ? "bg-gray-200" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{conversation.title || conversation.id}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
                          {conversation.messages.length} messages
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(conversation.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <button className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22"
                        />
                      </svg>
                    </button>
                  </div>

                  {conversation.messages.length > 1 && (
                    <p className="text-xs text-gray-500 mt-2 truncate">
                      {conversation.messages[conversation.messages.length - 1]?.content}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Conversation