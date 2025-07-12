// lib/actions/admin/academic-structure-actions.ts - Academic CRUD operations
'use server';
import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ActionResult, createActionResult, handleActionError } from '../base-actions';
import type { Program, Level, Semester } from '@/app/store/academicStore';
import slugify from '@/app/utils/slugify';
import { error } from 'console';



// Program Actions
export async function findProgramById(id: string): Promise<ActionResult<Program | null>> {
  try {
    const program = await prisma.program.findUnique({
      where: { id },
    });
    return createActionResult(true, program);
  } catch (error) {
    return handleActionError(error, 'Failed to find program');
  }
}

export async function findProgramIdByName(name: string): Promise<string | null> {
  try {
    const program = await prisma.program.findFirst({
      where: { slug: slugify(name) },
    });
    return program ? program.id : null;
  } catch (error) {
    return null;
  }
}
export async function createProgram(data: {
  name: string;
  description?: string;
  code: string;
  status?:string
}): Promise<ActionResult<Program>> {
  try {
    const existingProgram = await prisma.program.findFirst({
      where: { slug: data.name.trim() },
    });
    if (existingProgram) {
      return createActionResult(false, {} as Program,'Program Name cannot be used try another name');
    }
    const existingCode = await prisma.program.findFirst({
      where:{code:data.code}
    })
    if(existingCode){
      return createActionResult(false,{} as Program,'Code is already use try another code')
    }
    
    const program = await prisma.program.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        code: data.code,
        status: data.status || 'active',
        slug: slugify(data.name),
      },
    });
    
    revalidatePath('/admin/academic-structure');
    return createActionResult(true, program);
  } catch (error) {
    return handleActionError(error, 'Failed to create program');
  }
}

export async function getPrograms(): Promise<ActionResult<Program[]>> {
  try {
    const programs = await prisma.program.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log(programs)
    return createActionResult(true, programs);
  } catch (error) {
    return handleActionError(error, 'Failed to fetch programs');
  }
}

export async function updateProgram(
  id: string, 
  data: { name?: string; description?: string; code?:string; } 
): Promise<ActionResult<Program>> {
  const existingProgram  =  await prisma.program.findFirst({
    where: { slug: slugify(data.name || '') },
  })

  if (existingProgram) {
    return createActionResult(false, {} as Program,'Program Name cannot be used try another name');
  }
   const existingCode = await prisma.program.findFirst({
    where:{code:data.code}
   })
   if(existingCode){
      return createActionResult(false,{} as Program,'Code is already use .try aother')
   }
  try {
    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });
    
    revalidatePath('/admin/academic-structure');
    return createActionResult(true, program);
  } catch (error) {
    return handleActionError(error, 'Failed to update program');
  }
}

export async function deleteProgram(id: string): Promise<ActionResult> {
  try {
    await prisma.program.delete({ where: { id } });
    revalidatePath('/admin/academic-structure');
    return createActionResult(true);
  } catch (error) {
    return handleActionError(error, 'Failed to delete program');
  }
}

// Level Actions
export async function findLevelIdByName(name: string, programId?: string): Promise<string| string[] | null> {
  try {
    const levels = await prisma.level.findMany({
        select: {
            id: true,
            name: true,
            slug:true,
        }
    })

    const level = levels.filter((level) => level.slug.includes(slugify(name.toLowerCase())) && (programId && level.id === programId));
    return level.length > 0 ? level.map((level) => level.id) : null;
  } catch (error) {
    return null;
  }
}
export async function createLevel(data: {
  name: string;
  description?: string;
  programId: string;
  code: string;
}): Promise<ActionResult<Level>> {
  try {
    const validId = await prisma.program.findUnique({ where: { id: data.programId } });
    if (!validId) {
      return createActionResult(false, {} as Level,'Invalid program ID');
    }
    const existingLevel = await prisma.level.findFirst({
      where:{ slug:slugify(data.name)}
    })
    if(existingLevel){
      return createActionResult(false, {} as Level,'Level Name cannot be used try another name');
    }
    const existingCode = await prisma.level.findFirst({
      where:{code:data.code}
    })
    if(existingCode){
      return createActionResult(false,{}as Level,'Code already use try another');
    }
    const level = await prisma.level.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        programId: data.programId,
        code: data.code,
        slug: slugify(data.name),
      },
    });
    
    revalidatePath('/admin/academic-structure');
    return createActionResult(true, level);
  } catch (error) {
    return handleActionError(error, 'Failed to create level');
  }
}

export async function getLevels(programId?: string): Promise<ActionResult<Level[]>> {
  try {
    const levels = await prisma.level.findMany({
      where: programId ? { programId } : {},
      orderBy: { createdAt: 'desc' },
    });
    
    return createActionResult(true, levels);
  } catch (error) {
    return handleActionError(error, 'Failed to fetch levels');
  }
}

export async function updateLevel(
  id: string,
  data: { name?: string; description?: string,code?:string }
): Promise<ActionResult<Level>> {
  try {
    const existingLevel  =  await prisma.level.findFirst({
      where:{slug: slugify(data.name || '')}
    })

    if (existingLevel) {
      return createActionResult(false, {} as Level,'Level Name cannot be used try another name');
    }
    const existingCode = await prisma.level.findFirst({
      where:{code:data.code}
    })
    if(existingCode){
      return createActionResult(false,{} as Level,'Code is already use , try another one')
    }
    const level = await prisma.level.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });
    
    revalidatePath('/admin/academic-structure');
    return createActionResult(true, level);
  } catch (error) {
    return handleActionError(error, 'Failed to update level');
  }
}

export async function deleteLevel(id: string): Promise<ActionResult> {
  try {
    await prisma.level.delete({ where: { id } });
    revalidatePath('/admin/academic-structure');
    return createActionResult(true);
  } catch (error) {
    return handleActionError(error, 'Failed to delete level');
  }
}


// Semester Actions
export async function findSemesterIdByName(name: string, levelId?: string): Promise<string| string[] | null> {
  try {
    const semesters = await prisma.semester.findMany({
        select: {
            id: true,
            name: true,
            slug:true
        }
    })

    const semester = semesters.filter((semester) => semester.slug.toLowerCase().includes(slugify(name.toLowerCase())) && (levelId && semester.id === levelId));
    return semester.length > 0 ? semester.map((semester) => semester.id) : null;
  } catch (error) {
    return null;
  }
}
export async function createSemester(data: {
  name: string;
  description?: string;
  levelId: string;
  code: string;
}): Promise<ActionResult<Semester>> {
  try {
    const validId = await prisma.level.findUnique({ where: { id: data.levelId } });
    if (!validId) {
      return createActionResult(false, {} as Semester,'Invalid level ID');
    }
    const existingSemester = await prisma.semester.findFirst({
      where:{ slug:slugify(data.name)}
    })
    if(existingSemester){
      return createActionResult(false, {} as Semester,'Semester Name cannot be used try another name');
    }
    const existingCode = await prisma.semester.findFirst({
      where:{code:data.code}
    })
    if(existingCode){
      return createActionResult(false,{} as Semester,'Code is already use,try another one');
    }
    const semester = await prisma.semester.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        levelId: data.levelId,
        code: data.code,
        slug: slugify(data.name),
      },
    });
    
    revalidatePath('/admin/academic-structure');
    return createActionResult(true, semester);
  } catch (error) {
    return handleActionError(error, 'Failed to create semester');
  }
}
export async function getIdByCode(entity:'program'|'level'|'semester',code:string):Promise<ActionResult<string>>{
  switch (entity) {
    case 'program':
      const res= await prisma.program.findUnique({
        where:{code}
      })
      if(res){
        return createActionResult(true,res.id)
      }
        return {success:false,error:'No program with this code exist'}
    case 'level':
      const lres= await prisma.level.findUnique({
        where:{code}
      })
      if(lres){
        return createActionResult(true,lres.id)
      }
        return {success:false,error:'No level with this code exist'}
    case 'semester':
      const sres= await prisma.semester.findUnique({
        where:{code}
      })
      if(sres){
        return createActionResult(true,sres.id)
      }
        return {success:false,error:'No semester with this code exist'}
  
    default:
        return {success:false,error:'No entity of this exist'}
      break;
  }
}
export async function getSemesters(levelId?: string): Promise<ActionResult<Semester[]>> {
  try {
    const semesters = await prisma.semester.findMany({
      where: levelId ? { levelId } : {},
      orderBy: { createdAt: 'desc' },
    });
    
    return createActionResult(true, semesters);
  } catch (error) {
    return handleActionError(error, 'Failed to fetch semesters');
  }
}

export async function updateSemester(
  id: string,
  data: { name?: string; description?: string;code?:string; }
): Promise<ActionResult<Semester>> {
  try {
    const existingSemester  =  await prisma.semester.findFirst({
      where:{slug: slugify(data.name || '')}
    })

    if (existingSemester) {
      return createActionResult(false, {} as Semester,'Semester Name cannot be used try another name');
    }
    const existingCode = await prisma.level.findFirst({
      where:{code:data.code}
    })
    if(existingCode){
      return createActionResult(false,{} as Semester,'Code is already use,try another one')
    }
    const semester = await prisma.semester.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });
    
    revalidatePath('/admin/academic-structure');
    return createActionResult(true, semester);
  } catch (error) {
    return handleActionError(error, 'Failed to update semester');
  }
}

export async function deleteSemester(id: string): Promise<ActionResult> {
  try {
    await prisma.semester.delete({ where: { id } });
    revalidatePath('/admin/academic-structure');
    return createActionResult(true);
  } catch (error) {
    return handleActionError(error, 'Failed to delete semester');
  }
}

export async function retrieveField(entityType:'program' | 'level' | 'semester',feild: string, id?: string): Promise<string | string[] | null | undefined> {
  try {
    switch (entityType) {
      case 'program': {
        const program = await prisma.program.findMany({ select: { [feild]: true, id: true } as any });
        if (id && program.length > 0) {
          const found = program.find((p: any) => p.id === id);
          return found && found[feild] !== undefined ? (found[feild] as unknown as string) : null;
        } else if (!id && program.length > 0) {
          // Return all field values as string[]
          return program.map((p: any) => p[feild]).filter((v: any) => v !== undefined) as string[];
        }
        break;
      }
      case 'level': {
        const levels = await prisma.level.findMany({ select: { [feild]: true, id: true } as any });
        if (id && levels.length > 0) {
          const found = levels.find((l: any) => l.id === id);
          return found && found[feild] !== undefined ? (found[feild] as unknown as string) : null;
        }else if(!id && levels.length > 0) {
          // Return all field values as string[]
          return levels.map((l: any) => l[feild]).filter((v: any) => v !== undefined) as string[];
        }
        break;
      }
      case 'semester': {
        const semesters = await prisma.semester.findMany({ select: { [feild]: true, id: true } as any });
        if (id && semesters.length > 0) {
          const found = semesters.find((s: any) => s.id === id);
          return found && found[feild] !== undefined ? (found[feild] as unknown as string) : null;
        }else if(!id && semesters.length > 0) {
          // Return all field values as string[]
          return semesters.map((s: any) => s[feild]).filter((v: any) => v !== undefined) as string[];
        }
        break;
      }
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

// AI Integration Action
export async function processAcademicAIRequest(
  userInput: string,
  context?: {
    programs?: Array<{id: string, name: string, description?: string}>;
    levels?: Array<{id: string, name: string, programId: string, description?: string}>;
    semesters?: Array<{id: string, name: string, levelId: string, description?: string}>;
  }
): Promise<ActionResult> {
  try {
    const { AcademicAIAgent } = await import('@/app/ai/academic-agent');
    const agent = new AcademicAIAgent();
    const result = await agent.processRequest(userInput, context);
    
    if (!result.success) {
      return result;
    }
    
    const action:any = result.data;
    
    // Execute the appropriate action
    switch (action.action) {
      case 'create_program':
        return await createProgram({
          name: action.name,
          description: action.description,
          code: action.code,
        });
        
      case 'create_level':
        return await createLevel({
          name: action.name,
          description: action.description,
          programId: action.programId,
          code: action.code,
        });
        
      case 'create_semester':
        return await createSemester({
          name: action.name,
          description: action.description,
          levelId: action.levelId,
          code: action.code,});
        
      case 'list':
        switch (action.entity) {
          case 'programs':
            return await getPrograms();
          case 'levels':
            return await getLevels();
          case 'semesters':
            return await getSemesters();
        }
        break;
        
      case 'query':
        return createActionResult(true, {
          message: "Query functionality will be implemented in future versions",
          question: action.question
        });
        
      default:
        return createActionResult(false, undefined, 'Unknown action type');
    }
  } catch (error) {
    return handleActionError(error, 'Failed to process AI request');
  }
  // Ensure a return value for all code paths
  return createActionResult(false, undefined, 'No action was taken');
}