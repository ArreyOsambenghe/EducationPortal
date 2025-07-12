'use server'

import { Department } from "@/app/generated/prisma"
import prisma from "@/app/lib/prisma"
import { ActionResult, createActionResult } from "../base-actions"
import slugify from "@/app/utils/slugify"
import { revalidatePath } from "next/cache"


export const getAllDepartments = async ():Promise<ActionResult<Department[]>> => {
    try{
        const departments = await prisma.department.findMany({
            orderBy:{createdAt:'desc'}
        })
        return createActionResult(true,departments)
    }catch(error){
        console.error('Error fetching departments:', error)
        return {success:false,error:'Failed to fetch departments'}
    }
}

export const getDepartmentById = async (id:string):Promise<ActionResult<Department>> => {
    try{
        const department = await prisma.department.findUnique({
            where:{id}
        })
        if(!department){
            return {success:false,error:'Department not found'}
        }
        return createActionResult(true,department)
    }catch(error){
        console.error('Error fetching department:', error)
        return {success:false,error:'Failed to fetch department'}
    }
}

export const getDepartmentIdByName = async (name:string):Promise<ActionResult<Department>> => {

    try{
        const department = await prisma.department.findFirst({
        where:{
            slug:{
                contains:slugify(name),
                mode:'insensitive'
            }
        }
    })
    if(!department){
        return {
            success:false,error:'Department not found'
        }
    }
    return createActionResult(true,department)
    }
    catch(error){
      console.error('Error fetching department:', error)
        return {success:false,error:'Failed to fetch department'}  
    }
}
export const createDepartment = async (data:Omit<Department,'id'|'createdAt'|'updatedAt'>):Promise<ActionResult<Department>> => {
    try{
        const existingDepartment = await prisma.department.findFirst({
            where:{slug:data.slug}
        })
        if(existingDepartment){
            return {success:false,error:'Department with this name  already exists. try another'}
        }
        const newDepartment = await prisma.department.create({
            data
        })
        revalidatePath('/admin/department');
        return createActionResult(true,newDepartment)
    }catch(error){
        console.error('Error creating department:', error)
        return {success:false,error:'Failed to create department'}
    }
}

export const updateDepartment = async (id:string,data:Partial<Omit<Department,'id'>>):Promise<ActionResult<Department>> => {
    try{
        const existingNDepartment = await prisma.department.findUnique({
            where:{slug:data.slug}
        })
        if(existingNDepartment && existingNDepartment.id !== id){
            return {success:false,error:'Department with this name already exists. try another'}
        }
        const existingDepartment = await prisma.department.findUnique({
            where:{id}
        })
        if(!existingDepartment){
            return {success:false,error:'Department not found'}
        }
        const updatedDepartment = await prisma.department.update({
            where:{id},
            data
        })
        revalidatePath('/admin/department');
        return createActionResult(true,updatedDepartment)
    }catch(error){
        console.error('Error updating department:', error)
        return {success:false,error:'Failed to update department'}
    }
}

export const deleteDepartment = async (id:string):Promise<ActionResult<Department>> => {
    try{
        
        const existingDepartment = await prisma.department.findUnique({
            where:{id}
        })
        if(!existingDepartment){
            return {success:false,error:'Department not found'}
        }
        const deletedDepartment = await prisma.department.delete({
            where:{id}
        })
        revalidatePath('/admin/department');
        return createActionResult(true,deletedDepartment)
    }catch(error){
        console.error('Error deleting department:', error)
        return {success:false,error:'Failed to delete department'}
    }
}