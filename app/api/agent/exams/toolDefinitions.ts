import { FunctionDeclaration, Tool, SchemaType } from '@google/generative-ai';



const getExamsFn: FunctionDeclaration = {
  name: 'getExams',
  description: 'Fetches all exams.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
    required: []
  }
};

const getExamByIdFn: FunctionDeclaration = {
  name: 'getExamById',
  description: 'Fetches a single exam by its ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING }
    },
    required: ['id']
  }
};



const getExamSubmissionsFn: FunctionDeclaration = {
  name: 'getExamSubmissions',
  description: 'Fetches all submissions for a given exam.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      examId: { type: SchemaType.STRING }
    },
    required: ['examId']
  }
};

const gradeSubmissionFn: FunctionDeclaration = {
  name: 'gradeSubmission',
  description: 'Grades a submission including feedback and points earned.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      submissionId: { type: SchemaType.STRING },
      grade: { type: SchemaType.NUMBER },
      feedback: { type: SchemaType.STRING },
      answers: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            pointsEarned: { type: SchemaType.NUMBER },
            isCorrect: { type: SchemaType.BOOLEAN }
          },
          required: ['id', 'pointsEarned']
        }
      }
    },
    required: ['submissionId', 'grade', 'answers']
  }
};

const getExamAnalyticsFn: FunctionDeclaration = {
  name: 'getExamAnalytics',
  description: 'Calculates analytics for an exam: score distribution, pass rate, etc.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      examId: { type: SchemaType.STRING }
    },
    required: ['examId']
  }
};

// Group into tools
export const examTools: Tool[] = [
  { functionDeclarations: [getExamsFn] },
  { functionDeclarations: [getExamByIdFn] },
  { functionDeclarations: [getExamSubmissionsFn] },
  { functionDeclarations: [getExamAnalyticsFn] }
];
