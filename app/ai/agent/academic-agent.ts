import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import { BaseAgent } from "./baseAgent";

// Import your action functions
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
} from "@/app/actions/admin/academic.action";

export class AcademicAgent extends BaseAgent {
  constructor() {
    super("AcademicAgent", "Manage programs, levels, and semesters");
  }

  protected createTools(): DynamicStructuredTool[] {
    const ProgramSchema = z.object({ 
      id: z.string().cuid().optional(), 
      name: z.string(), 
      description: z.string().optional().transform((s) => s?.replace(/\r?\n/g, " ")), 
      status: z.string().optional(), 
      code: z.string() 
    });
    
    const ProgramFilter = z.object({ 
      status: z.string().optional(), 
      code: z.string().optional() 
    });
    
    const LevelSchema = z.object({ 
      id: z.string().cuid().optional(), 
      name: z.string(), 
      description: z.string().optional().transform((s) => s?.replace(/\r?\n/g, " ")), 
      status: z.string().optional(), 
      code: z.string(), 
      programId: z.string().cuid() 
    });
    
    const LevelFilter = z.object({ 
      programId: z.string().cuid().optional(), 
      status: z.string().optional() 
    });
    
    const SemesterSchema = z.object({ 
      id: z.string().cuid().optional(), 
      name: z.string(), 
      description: z.string().optional(), 
      status: z.string().optional(), 
      code: z.string(), 
      levelId: z.string().cuid() 
    });
    
    const SemesterFilter = z.object({ 
      levelId: z.string().cuid().optional(), 
      status: z.string().optional() 
    });

    return [
      new DynamicStructuredTool({
        name: "create_program",
        description: "Create a new Program. Requires name and code. Description and status are optional.",
        schema: ProgramSchema.omit({id:true}),
        func: async (input) => {
          try {
            console.log(
                'Input for pg',input
            )
            const result = await createProgram(input);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to create program" };
          }
        },
      }),
      new DynamicStructuredTool({
  name: "respond",
  description: "Use this tool to respond to user greetings, questions, or confirmations that don't require database actions.",
  schema: z.object({
    message: z.string(),
  }),
  func: async ({ message }) => {
    return message;
  },
}),
    //   new DynamicStructuredTool({
    //     name: "get_programs",
    //     description: "List all Programs with optional filters by status or code",
    //     schema: ProgramFilter,
    //     func: async (filters) => {
    //       try {
    //         const result = await getPrograms(filters);
    //         return { success: true, data: result };
    //       } catch (error) {
    //         return { success: false, error: error instanceof Error ? error.message : "Failed to get programs" };
    //       }
    //     },
    //   }),
      
      new DynamicStructuredTool({
        name: "update_program",
        description: "Update an existing Program by providing the id and fields to update",
        schema: ProgramSchema,
        func: async ({ id, ...rest }) => {
          try {
            if (!id) throw new Error("Program ID is required for updates");
            const result = await updateProgram(id, rest);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to update program" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "delete_program",
        description: "Delete a Program by its ID",
        schema: z.object({ id: z.string().cuid() }),
        func: async ({ id }) => {
          try {
            const result = await deleteProgram(id);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to delete program" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "create_level",
        description: "Create a new Level. Requires name, code, and programId. Description and status are optional.",
        schema: LevelSchema.omit({ id: true }),
        func: async (data) => {
          try {
            const result = await createLevel(data);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to create level" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "get_levels",
        description: "List all Levels with optional filters by programId or status",
        schema: LevelFilter,
        func: async (filters) => {
          try {
            const result = await getLevels(filters);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to get levels" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "update_level",
        description: "Update an existing Level by providing the id and fields to update",
        schema: LevelSchema,
        func: async ({ id, ...rest }) => {
          try {
            if (!id) throw new Error("Level ID is required for updates");
            const result = await updateLevel(id, rest);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to update level" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "delete_level",
        description: "Delete a Level by its ID",
        schema: z.object({ id: z.string().cuid() }),
        func: async ({ id }) => {
          try {
            const result = await deleteLevel(id);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to delete level" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "create_semester",
        description: "Create a new Semester. Requires name, code, and levelId. Description and status are optional.",
        schema: SemesterSchema.omit({ id: true }),
        func: async (data) => {
          try {
            const result = await createSemester(data);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to create semester" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "get_semesters",
        description: "List all Semesters with optional filters by levelId or status",
        schema: SemesterFilter,
        func: async (filters) => {
          try {
            const result = await getSemesters(filters);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to get semesters" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "update_semester",
        description: "Update an existing Semester by providing the id and fields to update",
        schema: SemesterSchema,
        func: async ({ id, ...rest }) => {
          try {
            if (!id) throw new Error("Semester ID is required for updates");
            const result = await updateSemester(id, rest);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to update semester" };
          }
        },
      }),
      
      new DynamicStructuredTool({
        name: "delete_semester",
        description: "Delete a Semester by its ID",
        schema: z.object({ id: z.string().cuid() }),
        func: async ({ id }) => {
          try {
            const result = await deleteSemester(id);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to delete semester" };
          }
        },
      }),
    ];
  }

  // Remove the createPromptTemplate override since BaseAgent now handles it correctly
  // The base class implementation is sufficient
}

export const academicAgent = new AcademicAgent();