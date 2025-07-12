import { getAllDepartments } from '@/app/actions/admin/department.action'
import React from 'react'
import DepartmentCRUD from './DepartmentManagement'

const page = async () => {
  const Departments = await getAllDepartments()
  if(!Departments.data){
    return(
      <>
        {Departments.error}
      </>
    )
  }
  return (
    <DepartmentCRUD initialDepartments={Departments.data || []}/>
  )
}

export default page