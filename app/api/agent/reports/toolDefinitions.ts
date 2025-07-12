import { FunctionDeclaration, SchemaType, Tool } from "@google/generative-ai"

export const getOverviewStatsTool: FunctionDeclaration = {
  name: "getOverviewStats",
  description: "Fetch overview statistics about students, courses, faculty, and graduation rate with optional filters for period and department.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      period: {
        type: SchemaType.STRING,
        enum: ["semester", "year", "quarter"],
        format: "enum",
        description: "Time period to fetch data for (default is 'semester').",
      },
      department: {
        type: SchemaType.STRING,
        description: "Department slug to filter by or 'all' for all departments (default is 'all').",
      },
      startDate: {
        type: SchemaType.STRING,
        description: "Optional start date to override period filter (ISO string).",
      },
      endDate: {
        type: SchemaType.STRING,
        description: "Optional end date to override period filter (ISO string).",
      },
    },
    required: [],
  },
}

export const getEnrollmentDataTool: FunctionDeclaration = {
  name: "getEnrollmentData",
  description: "Get enrollment statistics per month over the last 6 months with optional filters for period and department.",
  parameters: getOverviewStatsTool.parameters, // same params as overview stats
}

export const getDepartmentDataTool: FunctionDeclaration = {
  name: "getDepartmentData",
  description: "Fetch list of departments with student counts and colors for visualization.",
  parameters: getOverviewStatsTool.parameters,
}

export const getPerformanceDataTool: FunctionDeclaration = {
  name: "getPerformanceData",
  description: "Get average GPA and completion rates by semester with optional filters.",
  parameters: getOverviewStatsTool.parameters,
}

export const getRecentStudentsTool: FunctionDeclaration = {
  name: "getRecentStudents",
  description: "Get recent active students along with their GPA and department info, filtered optionally by period and department.",
  parameters: getOverviewStatsTool.parameters,
}

export const getDepartmentOptionsTool: FunctionDeclaration = {
  name: "getDepartmentOptions",
  description: "Retrieve list of all departments for selection options.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
}

export const searchStudentsTool: FunctionDeclaration = {
  name: "searchStudents",
  description: "Search active students by name, email, or matriculation number, with optional filtering by department and period.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "Search query string, minimum 2 characters.",
      },
      period: getOverviewStatsTool.parameters?.properties.period!,
      department: getOverviewStatsTool.parameters?.properties.department!,
      startDate: getOverviewStatsTool.parameters?.properties.startDate!,
      endDate: getOverviewStatsTool.parameters?.properties.endDate!,
    },
    required: ["query"],
  },
}

export const exportReportDataTool: FunctionDeclaration = {
  name: "exportReportData",
  description: "Exports aggregated report data including overview stats, enrollment, department, performance, and recent students.",
  parameters: getOverviewStatsTool.parameters,
}

// Export all tools as an array or object to easily register
export const reportTools:Tool[] = [
  {functionDeclarations: [getOverviewStatsTool]},
  {functionDeclarations: [getEnrollmentDataTool]},
  {functionDeclarations: [getDepartmentDataTool]},
  {functionDeclarations: [getPerformanceDataTool]},
  {functionDeclarations: [getRecentStudentsTool]},
  {functionDeclarations: [getDepartmentOptionsTool]},
  {functionDeclarations: [searchStudentsTool]},
  {functionDeclarations: [exportReportDataTool]},
  ...examTools
]
type ReportsFilter = {
  period?: "semester" | "year" | "quarter"
  department?: string
  startDate?: string
  endDate?: string
}

type SearchStudentsInput = ReportsFilter & {
  query: string
}
import * as reportActions from "@/app/actions/admin/report.action" // adjust path as needed
import { getExamAnalytics, getExamById, getExams, getExamSubmissions } from "@/app/actions/teacher/exam.action"
import { gradeSubmission } from "@/app/actions/teacher/assigment.action"
import { examTools } from "../exams/toolDefinitions"
export async function handleAction(
  actionName: string,
  args: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (actionName) {
      case "getOverviewStats":
        return await reportActions.getOverviewStats(args as  any)

      case "getEnrollmentData":
        return await reportActions.getEnrollmentData(args as  any)

      case "getDepartmentData":
        return await reportActions.getDepartmentData(args as  any)

      case "getPerformanceData":
        return await reportActions.getPerformanceData(args as  any)

      case "getRecentStudents":
        return await reportActions.getRecentStudents(args as  any)

      case "getDepartmentOptions":
        return await reportActions.getDepartmentOptions()

      case "searchStudents":
        // Validate required 'query'
        if (!args?.query || args.query.length < 2) {
          return { success: true, data: [] }
        }
        return await reportActions.searchStudents(args.query, args as  any)

      case "exportReportData":
        return await reportActions.exportReportData(args as  any)
    case "getExams":
        return await getExams()

      case "getExamById":
        if (!args?.id) throw new Error("Missing exam ID")
        return await getExamById(args.id)

      case "getExamSubmissions":
        if (!args?.examId) throw new Error("Missing examId")
        return await getExamSubmissions(args.examId)


      case "getExamAnalytics":
        if (!args?.examId) throw new Error("Missing examId")
        return await getExamAnalytics(args.examId)

      default:
        return { success: false, error: `Unknown action: ${actionName}` }
    }
  } catch (error) {
    console.error(`Error handling action ${actionName}:`, error)
    return { success: false, error: "Internal server error" }
  }
}