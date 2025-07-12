import { create } from "zustand"

export type calendarState = {
    selectedDate: Date | undefined
    setSelectedDate: (date: Date | undefined) => void
    showModal: boolean
    setShowModal: (show: boolean) => void
    showDeleteModal: {
        id: string
        index: number
        loading:boolean
        open: boolean
    }
    setShowDeleteModal: (show: {id:string, index:number,loading:boolean,open:boolean}) => void
    
}

export const useCalendarStore = create<calendarState>((set) => ({
    selectedDate: new Date(),
    showModal: false,
    setShowModal: (show) => set({ showModal: show }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    showDeleteModal:{
        id:'',
        index:-1,
        loading:false,
        open:false
    },
    setShowDeleteModal: (show) => set({ showDeleteModal: show }),
}))