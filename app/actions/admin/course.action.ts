'use server'

import { Department, Prisma, SemesterCourse, Teacher } from "@/app/generated/prisma"
import prisma from "@/app/lib/prisma"
import { Course as PrismaCourse } from "@/app/generated/prisma"
import { ActionResult, createActionResult } from "../base-actions"
import { activateCourseDiscussions } from "@/app/utils/discussion.util"

export type CourseExtras = {
  prerequisites: string[]
  objective: string[]
}

export type Course = {
  id?: string
  name: string
  code: string
  department: {
    id: string
    name: string
  }
  schedule?: string
  room?: string
  instructor?: {
    id: string
    name: string
  }
  courseInfo: string
  credits: number
  courseExtras?: CourseExtras
  status: "active" | "inactive" | "upcomming"
  activeId: string | null // ID of the active semester course, if applicable
}
export const createCourse = async (courseData: Omit<Course,'id'>):Promise<ActionResult<(PrismaCourse & {semesterCourse:SemesterCourse[]})>> => {
   try {
     if (courseData.status == 'active'){
        const res = await prisma.course.create({
            data:{
                name: courseData.name,
                code: courseData.code,
                departmentId: courseData.department.id,
                courseInfo: courseData.courseInfo,
                credits: courseData.credits,
                courseExtras: JSON.stringify(courseData.courseExtras || {}),
                status: courseData.status,
                semesterCourse:{
                    create:{
                        instructorId: courseData.instructor?.id || '',
                        
                        semester:'',
                        schedule: courseData.schedule || '',
                        room: courseData.room || '',
                    }
                }
            },
            include:{
                semesterCourse:true
            }
        })
        await activateCourseDiscussions(res.semesterCourse[0].id)
        return createActionResult(true,res)

    }
    else{
      const res =  await prisma.course.create({
            data:{
                name: courseData.name,
                code: courseData.code,
                departmentId: courseData.department.id,
                courseInfo: courseData.courseInfo,
                credits: courseData.credits,
                courseExtras: JSON.stringify(courseData.courseExtras || {}),
                status: courseData.status,
            },
            include:{
                semesterCourse:true
            }
        })
        return createActionResult(true,res)
    }
    
   } catch (error) {
    console.error("Error creating course:", error)
    return {success:false,error:'Failed to create course'}
    
   }
}

export const updateCourse = async (
  courseData: Course
): Promise<ActionResult<PrismaCourse>> => {
  try {
    if (!courseData.id) {
      return { success: false, error: 'Missing course ID' };
    }

    if (courseData.status === 'active') {
      const res = await prisma.course.update({
        where: { id: courseData.id },
        data: {
          name: courseData.name,
          code: courseData.code,
          departmentId: courseData.department.id,
          courseInfo: courseData.courseInfo,
          credits: courseData.credits,
          courseExtras: JSON.stringify(courseData.courseExtras || {}),
          status: courseData.status,
          semesterCourse: {
            upsert: {
              where: { id: courseData.activeId || '' },
              update: {
                instructorId: courseData.instructor?.id || '',
                schedule: courseData.schedule || '',
                semester: '',
              },
                create: {
                  instructorId: courseData.instructor?.id || '',
                  schedule: courseData.schedule || '',
                  room: courseData.room || '',
                  semester: '',
                },
              },
            },
        },
      });
      const semesterCourse = await prisma.semesterCourse.findFirst({
        where:{courseId:res.id}
      })
      if(semesterCourse){

        await activateCourseDiscussions(semesterCourse.id)
      }
      return createActionResult(true, res);
    } else {
      const res = await prisma.course.update({
        where: { id: courseData.id },
        data: {
          name: courseData.name,
          code: courseData.code,
          departmentId: courseData.department.id,
          courseInfo: courseData.courseInfo,
          credits: courseData.credits,
          status: courseData.status,
          courseExtras: JSON.stringify(courseData.courseExtras || {}),
        },
      });
      return createActionResult(true, res);
    }
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: 'Failed to update course' };
  }
};

export const deleteCourse = async (courseId: string) => {
    try {
      const res=   await prisma.course.delete({
        where: { id: courseId }
    })
        return createActionResult(true,res)
    } catch (error) {
        console.error("Error deleting course:", error)
        return {success:false,error:'Failed to delete course'}
        
    }
}

const getCourseById = async (courseId: string):Promise<ActionResult<PrismaCourse>> => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                semesterCourse: {
                    include: {
                        instructor: true,
                    }
                },
                department: true,
            }
        })
        if (!course) {
            return { success: false, error: 'Course not found' }
        }
        return createActionResult(true, course)
    } catch (error) {
        console.error("Error fetching course by ID:", error)
        return { success: false, error: 'Failed to fetch course' }
    }
}

export const getCourses = async ():Promise<ActionResult<(PrismaCourse & { semesterCourse: (SemesterCourse & { instructor: Teacher})[], department: Department })[]>> => {
    try {
        const res = await prisma.course.findMany({
        include:{
            semesterCourse: {
                include: {
                    instructor: true,
                }
            },
            department: true,
        }
    })
    return createActionResult(true, res)
    } catch (error) {
        console.error("Error fetching courses:", error)
        return { success: false, error: 'Failed to fetch courses' }
    }
}