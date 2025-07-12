import { FunctionDeclaration, Tool, SchemaType } from '@google/generative-ai';

// --- Tool Definitions for University Portal Actions ---
// Each FunctionDeclaration mirrors an async action in your lib/actions.

const createProgramFn: FunctionDeclaration = {
  name: 'createProgram',
  description: 'Creates a new program in the university portal.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING, description: 'Name of the program.' },
      description: { type: SchemaType.STRING, description: 'Optional description.' },
      code: { type: SchemaType.STRING, description: 'Program code. And it is unique' },
      status: { type: SchemaType.STRING, description: 'Program status.' },
    },
    required: ['name', 'code'],
  },
};

const getProgramsFn: FunctionDeclaration = {
  name: 'getPrograms',
  description: 'Retrieves all programs.',
  parameters: { type: SchemaType.OBJECT, properties: {}, required: [] },
};

const updateProgramFn: FunctionDeclaration = {
  name: 'updateProgram',
  description: 'Updates an existing program by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING, description: 'Program ID.' },
      name: { type: SchemaType.STRING, description: 'New name.' },
      description: { type: SchemaType.STRING, description: 'New description.' },
      code: { type: SchemaType.STRING, description: 'New code. And it is unique' },
    },
    required: ['id'],
  },
};
const findProgramIdByNameFn: FunctionDeclaration = {
  name: 'findProgramIdByName',
  description: 'Finds the ID of a program by its name.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      programName: { type: SchemaType.STRING, description: 'The name of the program to find.' },
    },
    required: ['programName'],
  },
};

const deleteProgramFn: FunctionDeclaration = {
  name: 'deleteProgram',
  description: 'Deletes a program by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: { id: { type: SchemaType.STRING, description: 'Program ID.' } },
    required: ['id'],
  },
};

const createLevelFn: FunctionDeclaration = {
  name: 'createLevel',
  description: 'Creates a new level under a program.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING, description: 'Level name.' },
      description: { type: SchemaType.STRING, description: 'Optional description.' },
      programId: { type: SchemaType.STRING, description: 'Program ID. And it is unique' },
      code: { type: SchemaType.STRING, description: 'Level code. And it is unique' },
    },
    required: ['name', 'programId', 'code'],
  },
};

const getLevelsFn: FunctionDeclaration = {
  name: 'getLevels',
  description: 'Retrieves levels, optionally filtered by program ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: { programId: { type: SchemaType.STRING, description: 'Program ID.' } },
    required: [],
  },
};

const updateLevelFn: FunctionDeclaration = {
  name: 'updateLevel',
  description: 'Updates a level by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING, description: 'Level ID.' },
      name: { type: SchemaType.STRING, description: 'New name.' },
      description: { type: SchemaType.STRING, description: 'New description.' },
      code: { type: SchemaType.STRING, description: 'New code.' },
    },
    required: ['id'],
  },
};

const deleteLevelFn: FunctionDeclaration = {
  name: 'deleteLevel',
  description: 'Deletes a level by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: { id: { type: SchemaType.STRING, description: 'Level ID.' } },
    required: ['id'],
  },
};
const findLevelIdByNameFn: FunctionDeclaration = {
  name: 'findLevelIdByName',
  description: 'Finds the ID of a level by its name, optionally within a specific program.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      levelName: { type: SchemaType.STRING, description: 'The name of the level to find.' },
      programId: { type: SchemaType.STRING, description: 'Optional: The ID of the program the level belongs to, to narrow the search.' },
    },
    required: ['levelName'],
  },
};

const createSemesterFn: FunctionDeclaration = {
  name: 'createSemester',
  description: 'Creates a new semester under a level.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING, description: 'Semester name.' },
      description: { type: SchemaType.STRING, description: 'Optional description.' },
      levelId: { type: SchemaType.STRING, description: 'Level ID.' },
      code: { type: SchemaType.STRING, description: 'Semester code.  And it is unique' },
    },
    required: ['name', 'levelId', 'code'],
  },
};

const getSemestersFn: FunctionDeclaration = {
  name: 'getSemesters',
  description: 'Retrieves semesters, optionally filtered by level ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: { levelId: { type: SchemaType.STRING, description: 'Level ID.' } },
    required: [],
  },
};

const updateSemesterFn: FunctionDeclaration = {
  name: 'updateSemester',
  description: 'Updates a semester by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING, description: 'Semester ID.' },
      name: { type: SchemaType.STRING, description: 'New name.' },
      description: { type: SchemaType.STRING, description: 'New description.' },
      code: { type: SchemaType.STRING, description: 'New code.  And it is unique' },
    },
    required: ['id'],
  },
};

const deleteSemesterFn: FunctionDeclaration = {
  name: 'deleteSemester',
  description: 'Deletes a semester by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: { id: { type: SchemaType.STRING, description: 'Semester ID.' } },
    required: ['id'],
  },
};
const findSemesterIdByNameFn: FunctionDeclaration = {
  name: 'findSemesterIdByName',
  description: 'Finds the ID of a level by its name, optionally within a specific program.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      semesterName: { type: SchemaType.STRING, description: 'The name of the semester to find.' },
      levelId: { type: SchemaType.STRING, description: 'Optional: The ID of the level the semester belongs to, to narrow the search.' },
    },
    required: ['semesterName'],
  },
};
const findIdByCodeFn: FunctionDeclaration = {
  name: 'findIdByCode',
  description: 'Finds the ID of a program, level or semester by its code, optionally within a specific entity.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      entity: { type: SchemaType.STRING, description: 'The name of the entity that can be program , level,semester.' },
      code: { type: SchemaType.STRING, description: 'Optional: The code of the object entity, to be  search.' },
    },
    required: ['entity','code'],
  },
};

const retrieveFieldFn: FunctionDeclaration = {
  name: 'retrieveField',
  description: 'Retrieves a specific field value (e.g., name, code, description) for a given entity (program, level, or semester) by its ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      entityType: {
        type: SchemaType.STRING,
        format: "enum",
        description: 'The type of entity (e.g., "program", "level", "semester").',
        enum: ['program', 'level', 'semester'], // Restrict to known entity types
      },
      entityId: { type: SchemaType.STRING, description: 'The ID of the specific entity instance.' },
      fieldName: { type: SchemaType.STRING, description: 'The name of the field to retrieve (e.g., "name", "code", "description").' },
    },
    required: ['entityType',  'fieldName'],
  },
};


// Export tools array
export const tools: Tool[] = [
  {functionDeclarations: [findIdByCodeFn]},
  { functionDeclarations: [createProgramFn] },
  { functionDeclarations: [findProgramIdByNameFn] },
  { functionDeclarations: [getProgramsFn] },
  { functionDeclarations: [updateProgramFn] },
  { functionDeclarations: [deleteProgramFn] },
  { functionDeclarations: [findLevelIdByNameFn] },
  { functionDeclarations: [createLevelFn] },
  { functionDeclarations: [getLevelsFn] },
  { functionDeclarations: [updateLevelFn] },
  { functionDeclarations: [deleteLevelFn] },
  { functionDeclarations: [findSemesterIdByNameFn] },
  { functionDeclarations: [createSemesterFn] },
  { functionDeclarations: [getSemestersFn] },
  { functionDeclarations: [updateSemesterFn] },
  { functionDeclarations: [deleteSemesterFn] },
  { functionDeclarations: [retrieveFieldFn] },
];

import {
  createProgram,
  getPrograms,
  updateProgram,
  deleteProgram,
  createLevel,
  getLevels,
  updateLevel,
  deleteLevel,
  createSemester,
  getSemesters,
  updateSemester,
  deleteSemester,
  retrieveField,
  findProgramIdByName,
  findLevelIdByName,
  findSemesterIdByName,
  getIdByCode,
} from '@/app/actions/admin/academic.action';
import { ActionResult } from '@/app/actions/base-actions';

/**
 * Central handler to execute async actions based on function name.
 * Uses a switch to route the call to the correct function.
 */
export async function handleAction(
  name: string,
  args: Record<string, any>
): Promise<ActionResult<any>|any> {
  switch (name) {
    case 'createProgram':
      return await createProgram({
        name: args.name,
        description: args.description,
        code: args.code,
      });
    case 'getPrograms':
      return await getPrograms();
    case 'updateProgram':
      return await updateProgram(args.id, {
        name: args.name,
        description: args.description,
      });
    case 'deleteProgram':
      return await deleteProgram(args.id);

    case 'createLevel':
      return await createLevel({
        name: args.name,
        description: args.description,
        programId: args.programId,
        code: args.code,
      });
    case 'getLevels':
      // if programId undefined, action will fetch all levels
      return await getLevels(args.programId);
    case 'updateLevel':
      return await updateLevel(args.id, {
        name: args.name,
        description: args.description,
      });
    case 'deleteLevel':
      return await deleteLevel(args.id);

    case 'createSemester':
      return await createSemester({
        name: args.name,
        description: args.description,
        levelId: args.levelId,
        code: args.code,
      });
    case 'getSemesters':
      return await getSemesters(args.levelId);
    case 'updateSemester':
      return await updateSemester(args.id, {
        name: args.name,
        description: args.description,
      });
    case 'deleteSemester':
      return await deleteSemester(args.id);

    case 'retrieveField':
      const filed = await retrieveField(args.entityType, args.fieldName,args.entityId);
      if(!filed){
        return {success: false, error: "Field not found or Invalid field name or id"};
      }
      return {success: true, data: filed};
    
    case 'findProgramIdByName':
      const res = await findProgramIdByName(args.programName);
      if(!res){
        return {success: false, error: "Program not found or Invalid program name"};
      }
      return {success: true, data: res};
    case 'findLevelIdByName':
      const response = await findLevelIdByName(args.levelName, args.programId);
      if(!response){
        return {success: false, error: "Level not found or Invalid level name"};
      }
      return {success: true, data: response};
    case 'findSemesterIdByName':
      const sresponse =  await findSemesterIdByName(args.semesterName, args.levelId);
      if(!sresponse){
        return {success: false, error: "Semester not found or Invalid semester name"};
      }
      return {success: true, data: sresponse};
    case 'findIdByCode':
      return await getIdByCode(args.entity,args.code)
    default:
      throw new Error(`Unknown action: ${name}`);
  }
}
