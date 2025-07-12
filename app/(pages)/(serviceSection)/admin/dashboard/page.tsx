import { Metadata } from 'next'
import React from 'react'
import AiChatSidebar from '../../component/ai-charts-sidebar'
import Dashboard from '../../component/dashboard'
import prisma from '@/app/lib/prisma'

type Props = {
    
}

export async function generateMetadata():Promise<Metadata> {
    return{
        title:'Dashboard',
        description:'Dashboard Management'
    }
}
const page = async (props: Props) => {
  const programId = "cmcm9z86s0009toc4ahurbs5v";

const program = await prisma.program.findUnique({
  where: { id: programId },
});
console.log(program)
  return (
    <Dashboard/>
  )
}

export default page