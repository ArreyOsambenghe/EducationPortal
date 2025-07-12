"use client"
import React from 'react';
import { BookOpenIcon, CalendarIcon, FileTextIcon, UsersIcon, MessageSquareIcon, SettingsIcon, BarChart2Icon, FileIcon, BellIcon, XIcon, HomeIcon, University, Users2, Layers, SwatchBook } from 'lucide-react';
import Link from 'next/link'
import { useShallow } from 'zustand/shallow';
import { useNavigationStore } from '@/app/store/NavigationStore';
import { usePathname } from 'next/navigation';
interface SidebarProps {
  currentRole: 'student'|'teacher'|'admin';
}
export const Sidebar = ({
  currentRole,
}: SidebarProps) => {

  const {isOpen,setOpen} = useNavigationStore(useShallow((state)=>({
      isOpen:state.sideBarOpen,
      setOpen:state.setSideBarOpen,
    })))
  // Role-based navigation items
  const navigationItems = {
    student: [
      {
      name: 'Home',
      icon: <HomeIcon size={20} />
    }, 
    {
      name: 'Course',
      icon: <BookOpenIcon size={20} />
    }, 
    
    {
      name: 'Materials',
      icon: <FileTextIcon size={20} />
    },
     
     {
      name: 'Discussion',
      icon: <MessageSquareIcon size={20} />
    }],
    teacher: [{
      name: 'Home',
      icon: <HomeIcon size={20} />
    }, {
      name: 'Course',
      icon: <BookOpenIcon size={20} />
    },  {
      name: 'Assignments',
      icon: <FileTextIcon size={20} />
    }, {
      name: 'Exam',
      icon: <SwatchBook size={20} />
    }, {
      name: 'Calendar',
      icon: <CalendarIcon size={20} />
    }, {
      name: 'discussions',
      icon: <MessageSquareIcon size={20} />
    }],
    admin: [{
      name: 'Home',
      icon: <HomeIcon size={20} />
    },{
      name:'Academic-Structure',
      icon:<Layers size={20}/>
    },{
      name:'Department',
      icon:<University size={20}/>
    }, {
      name: 'Student',
      icon: <Users2 size={20} />
    }, {
      name: 'Courses',
      icon: <BookOpenIcon size={20} />
    }, {
      name: 'Reports',
      icon: <BarChart2Icon size={20} />
    }, {
      name: 'Documents',
      icon: <FileIcon size={20} />
    }, {
      name: 'Notifications',
      icon: <BellIcon size={20} />
    }, {
      name: 'Settings',
      icon: <SettingsIcon size={20} />
    }]
  };
  const pathName = usePathname().split('/')[2]
  // Role-based accent colors
  const roleColors = {
    student: 'border-blue-600',
    teacher: 'border-green-600',
    admin: 'border-purple-600'
  };
  return <>
      {/* Mobile overlay */}
      {isOpen && <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 z-20 md:hidden`} onClick={()=>setOpen(false)}></div>}
      {/* Sidebar */}
      <aside className={`
          fixed md:static inset-y-0 left-0 z-30   bg-white shadow-lg transform 
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full hidden'} 
           transition-transform duration-300 ease-in-out
        `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 ">
            <span className="font-bold text-xl">EduSync</span>
            <button className="p-2 rounded-md hover:bg-gray-100" onClick={()=>setOpen(!isOpen)}>
              <XIcon size={20} />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems[currentRole].map(item => <Link key={item.name} href={`${item.name.toLocaleLowerCase().replaceAll(' ','-') == "home" ? "dashboard": item.name.toLocaleLowerCase()}`} className={`
                  flex items-center px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100
                  ${item.name.toLocaleLowerCase().replaceAll('-',' ') === pathName || item.name.toLocaleLowerCase() == "home" && pathName == "dashboard" ? `border-l-4 ${roleColors[currentRole]} bg-gray-50` : ''}
                `}>
                <span className="mr-3 text-gray-500">{item.icon}</span>
                <span>{item.name}</span>
              </Link>)}
          </nav>
        </div>
      </aside>
    </>;
};