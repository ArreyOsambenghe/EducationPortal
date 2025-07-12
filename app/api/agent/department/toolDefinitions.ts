import { createDepartment, deleteDepartment, getAllDepartments, getDepartmentById, getDepartmentIdByName, updateDepartment } from "@/app/actions/admin/department.action";
import { ActionResult } from "@/app/actions/base-actions";
import { FunctionDeclaration, SchemaType, Tool } from "@google/generative-ai";

const createDepartmentFn: FunctionDeclaration = {
  name: 'createDepartment',
  description: 'Creates a new program in the university portal.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING, description: 'Name of the program.' },
      slug: { type: SchemaType.STRING, description: 'Slug unique. and is generated from the name' },
      departmentHeadName:  { type: SchemaType.STRING, description: 'Department Head Name' },
      departmentHeadEmail: { type: SchemaType.STRING, description: 'Department Head Email.' },
    },
    required: ['name', 'slug'],
  },
};

const updateDepartmentFn: FunctionDeclaration = {
  name: 'updateDepartment',
  description: 'Updates an existing program in the university portal.',
  parameters:{
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING, description: 'ID of the program to update.' },
      name: { type: SchemaType.STRING, description: 'Updated name of the program.' },
      slug: { type: SchemaType.STRING, description: 'Updated slug unique.' },
      departmentHeadName:  { type: SchemaType.STRING, description: 'Department Head Name' },
      departmentHeadEmail: { type: SchemaType.STRING, description: 'Department Head Email.' },
    },
    required: ['id'],
  }
}


const deleteDepartmentFn:FunctionDeclaration = {
    name: 'deleteDepartment',
    description: 'Deletes an existing program in the university portal.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
        id: { type: SchemaType.STRING, description: 'ID of the program to delete.' },
        },
        required: ['id'],
    },
}


const getDepartmentIdByNameFn:FunctionDeclaration ={
    name:'getDepartmentIdByName',
    description:'get a department id by his name',
    parameters:{
        type:SchemaType.OBJECT,
        properties:{
            name:{type:SchemaType.STRING,description:'name of the department'}
        },
        required:['name']
    }
}

const getDepartmentByIdFn:FunctionDeclaration = {
    name:'getDepartmentById',
    description:'get a department by id',
    parameters:{
        type:SchemaType.OBJECT,
        properties:{
            id:{type:SchemaType.STRING,description:'Id of the deparment'}
        },
        required:['id']
    }
}
const getAllDepartmentsFn:FunctionDeclaration = {
    name:'getAllDepartments',
    description:'get all departments',
    parameters:{
        type:SchemaType.OBJECT,
        properties:{},
        required:[]
    }
}
type actionType= 'createDepartment'|'updateDepartment'|'deleteDepartment'|'getDepartmentIdByName'|'getDepartmentById'|'getAllDepartments'

export const tools:Tool[] = [
    {functionDeclarations:[createDepartmentFn]},
    {functionDeclarations:[updateDepartmentFn]},
    {functionDeclarations:[deleteDepartmentFn]},
    {functionDeclarations:[getDepartmentIdByNameFn]},
    {functionDeclarations:[getDepartmentByIdFn]},
    {functionDeclarations:[getAllDepartmentsFn]}
]

export async function handleAction(
  name: string,
  args: Record<string, any>
): Promise<ActionResult<any>|any> {
    switch (name as actionType) {
        case "createDepartment":
            return await createDepartment({
                name:args.name,
                slug:args.slug,
                departmentHeadEmail:args.departmentHeadEmail,
                departmentHeadName:args.departmentHeadName
            })
        case "updateDepartment":
            return await updateDepartment(args.id, args);
        case "deleteDepartment":
            return await deleteDepartment(args.id);
        case "getDepartmentIdByName":
            return await getDepartmentIdByName(args.name);
        case "getDepartmentById":
            return await getDepartmentById(args.id);
        case "getAllDepartments":
            return await getAllDepartments();
        default:
            return {success:false,error:'Action type not allowd'}
            break;
    }
}