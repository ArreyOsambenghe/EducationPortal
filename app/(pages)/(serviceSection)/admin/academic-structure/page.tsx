
import React from 'react'
import AcademicStructure from './_component/academicStructure/AcademicStructure'

const page = async () => {


  const res = await fetch('http://localhost:3000/api/admin/academicStructure');
  if (!res.ok) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-lg border border-red-200 p-8 mt-10">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
          </svg>
          <span className="text-lg font-semibold text-red-600">Failed to load academic structure</span>
        </div>
        <p className="text-gray-500 text-sm">Please check your connection or try again later.</p>
      </div>
    )
  }
  const {data} = await res.json();
  console.log(data)
  

   
  return (
    <AcademicStructure academicData={data} />
  )
}

export default page