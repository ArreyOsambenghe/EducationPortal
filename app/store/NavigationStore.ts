import { create } from "zustand"

export type NavigationState = {
    openChatSideBar:boolean
    setOpenChatSideBar:(value:boolean) => void
    sideBarOpen:boolean
    setSideBarOpen:(value:boolean) => void
}


export const useNavigationStore = create<NavigationState>((set) => ({
    openChatSideBar:true,
    setOpenChatSideBar:(value) => set({openChatSideBar:value}),
    sideBarOpen:true,
    setSideBarOpen:(value) => set({sideBarOpen:value})
}))