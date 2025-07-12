import { z } from "zod";
import { BaseAIAgent } from "./base-agent";

// Academic Action Schemas
const ProgramSchema = z.object({
  action: z.literal("create_program"),
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
});

const LevelSchema = z.object({
  action: z.literal("create_level"),
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  programId: z.string(),
});

const SemesterSchema = z.object({
  action: z.literal("create_semester"),
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  levelId: z.string(),
});

const ListSchema = z.object({
  action: z.literal("list"),
  entity: z.enum(["programs", "levels", "semesters"]),
  filters: z.record(z.string()).optional(),
});

const QuerySchema = z.object({
  action: z.literal("query"),
  question: z.string(),
  entity: z.enum(["programs", "levels", "semesters"]).optional(),
});

export const AcademicActionSchema = z.union([
  ProgramSchema, 
  LevelSchema, 
  SemesterSchema, 
  ListSchema, 
  QuerySchema
]);

export type AcademicAction = z.infer<typeof AcademicActionSchema>;

interface AcademicContext {
  programs?: Array<{id: string, name: string, description?: string, code: string}>;
  levels?: Array<{id: string, name: string, programId: string, description?: string, code: string}>;
  semesters?: Array<{id: string, name: string, levelId: string, description?: string, code: string}>;
}

export class AcademicAIAgent extends BaseAIAgent<typeof AcademicActionSchema> {
  constructor() {
    super(AcademicActionSchema);
  }

  protected getSystemPrompt(): string {
    return `
You are an AI assistant for a university portal that helps manage academic programs, levels, and semesters.

Your capabilities:
1. CREATE PROGRAM: Create new academic programs (e.g., Bachelor, Master, PhD)
2. CREATE LEVEL: Create academic levels within programs (e.g. level 1 of Bachelor or level 2 of Master)  
3. CREATE SEMESTER: Create semesters within levels (e.g., Fall 2024, Spring 2025,Semester 1)
4. LIST: List existing programs, levels, or semesters with optional filters
5. QUERY: Answer questions about academic structure

Rules for creation:
- Programs are top-level (no dependencies)
- Levels require an existing programId
- Semesters require an existing levelId
- Extract meaningful names and descriptions from user input
- Use existing IDs from context when referencing programs/levels

Examples of valid requests:
- "Create a Bachelor program"
- "Add a  level name as Level 1 for  the Bachelor program" 
- "Create Fall 2024 semester for Bachelor level 1 "
- "List all programs"
- "Show me levels for Computer Science"
- "What semesters are available?"
`;
  }

  protected getContextString(context?: AcademicContext): string {
    if (!context) return 'No existing data available.';
    
    return `
Available Programs: ${JSON.stringify(context.programs || [], null, 2)}
Available Levels: ${JSON.stringify(context.levels || [], null, 2)}  
Available Semesters: ${JSON.stringify(context.semesters || [], null, 2)}
`;
  }
}