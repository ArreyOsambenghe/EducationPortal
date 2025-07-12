import prisma from '@/app/lib/prisma'
import React from 'react'
import CourseCRUD, { Course } from './CourseManagement'
import { getCourses } from '@/app/actions/admin/course.action'

type Props = {}

const page = async (props: Props) => {
  const [instructors,departments,courses] = await Promise.all([
    (
      await prisma.teacher.findMany({
        select:{
          id:true,
          lastName:true,
          firstName:true,
        },
      })
    ),
    (
      await prisma.department.findMany({
        select:{
          id:true,
          name:true,
        },
      })
    ),
    getCourses().then((res) => {
      if (res.success && res.data) {
        const mappedCourses: Course[] = res.data.map((course) => {
      const firstSemesterCourse = course.semsterCourse?.[0] // pick the first semester course (or change logic if needed)
      
      return {
        id: course.id,
        name: course.name,
        code: course.code,
        department: {
          id: course.department.id,
          name: course.department.name,
        },
        schedule: firstSemesterCourse?.schedule ?? undefined,
        room: firstSemesterCourse?.room ?? undefined,
        instructor: firstSemesterCourse?.instructor
          ? {
              id: firstSemesterCourse.instructor.id,
              name: `${firstSemesterCourse.instructor.firstName} ${firstSemesterCourse.instructor.lastName}`,
            }
          : undefined,
        courseInfo: course.courseInfo,
        credits: course.credits,
        courseExtras: course.courseExtras? JSON.parse(course.courseExtras):undefined, // Handle this if needed
        status: course.status as "active" | "inactive" | "upcomming",
        activeId: firstSemesterCourse?.id || null, // Assuming you want to track the active semester course ID
      };
    })
        return mappedCourses;
      }
      return [];
    }).catch((err) => {
      console.error("Error fetching courses:", err);
      return [];
    }),
        
  ])
  
  return (
    <CourseCRUD Instructors={instructors.map((inst) => ({
      id: inst.id,
      name:`${inst.firstName} ${inst.lastName}`,
    }))}
      Departments={departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
      }))}
      initialCourses={courses}
      />
  )
}

export default page