'use client'
import { useNavigationStore } from '@/app/store/NavigationStore'
import { Bell, Bot, Menu } from 'lucide-react'
import React from 'react'
import { useShallow } from 'zustand/shallow'

type Props = {}

const Navbar = (props: Props) => {
    const {sideBarOpen,setSideBarOpen,chatSideBarOpen,setChatSideBarOpen} = useNavigationStore(useShallow(state => ({
        sideBarOpen:state.sideBarOpen,
        setSideBarOpen:state.setSideBarOpen,
        chatSideBarOpen:state.openChatSideBar,
        setChatSideBarOpen:state.setOpenChatSideBar
    })))
  return (
    <div className="flex justify-between pl-2 pr-4 py-2 w-full">
        <div className="flex gap-2 items-center">
           {!sideBarOpen &&  <div onClick={()=>setSideBarOpen(true)} className="p-2 rounded-md shadow text-gray-800 cursor-pointer hover:scale-110 duration-300"><Menu/></div>}
           
        </div>
        <div className="flex items-center gap-2">
            {!chatSideBarOpen && <div onClick={() => setChatSideBarOpen(true)} className="p-2 rounded-md shadow text-gray-800 cursor-pointer hover:scale-110 duration-300"><Bot/></div>}
        <div className="p-2 rounded-md shadow  text-white bg-purple-600 cursor-pointer hover:scale-110 duration-300"><Bell/></div>
        </div>
    </div>
  )
}

export default Navbar