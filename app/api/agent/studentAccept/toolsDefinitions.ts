
import { admitStudent, updateStudentRegistrationProccess, getStudentDocuments, getStudents, verifiedStudentDocument, generateAdmissionPdf, sendAdmissionEmail } from "@/app/actions/admin/student.action";
import { ActionResult } from "@/app/actions/base-actions";
import { FunctionDeclaration, SchemaType, Tool } from "@google/generative-ai";

type actionType =
  | 'admitStudent'
  | 'updateStudentRegistrationProccess'
  | 'getStudentDocuments'
  | 'getStudents'
  | 'verifiedStudentDocument'
  | 'generateAdmissionPdf'
  | 'sendAdmissionEmail';

// Function Declarations
const admitStudentFn: FunctionDeclaration = {
  name: 'admitStudent',
  description: 'Admits a student by updating their registration process and assigning a matriculation number.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      studentId: { type: SchemaType.STRING, description: 'ID of the student to admit.' },
      matriculeNumber: { type: SchemaType.STRING, description: 'Assigned matriculation number.' }
    },
    required: ['studentId', 'matriculeNumber'],
  },
};

const updateStudentRegistrationProccessFn: FunctionDeclaration = {
  name: 'updateStudentRegistrationProccess',
  description: 'Updates the registration process status for a student.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      studentId: { type: SchemaType.STRING, description: 'ID of the student.' },
      registratioProcess: { type: SchemaType.STRING, description: 'New registration process status.' }
    },
    required: ['studentId', 'registratioProcess'],
  },
};

const getStudentDocumentsFn: FunctionDeclaration = {
  name: 'getStudentDocuments',
  description: 'Retrieves uploaded documents for a given student.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      studentId: { type: SchemaType.STRING, description: 'ID of the student.' }
    },
    required: ['studentId'],
  },
};

const getStudentsFn: FunctionDeclaration = {
  name: 'getStudents',
  description: 'Fetches all students along with their admission documents.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
    required: [],
  },
};

const verifiedStudentDocumentFn: FunctionDeclaration = {
  name: 'verifiedStudentDocument',
  description: 'Marks a student document as verified or unverified.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      documentId: { type: SchemaType.STRING, description: 'ID of the document to verify.' },
      verified: { type: SchemaType.BOOLEAN, description: 'Verification flag, true or false.' }
    },
    required: ['documentId'],
  },
};

const generateAdmissionPdfFn: FunctionDeclaration = {
  name: 'generateAdmissionPdf',
  description: 'Generates an admission PDF for a student and uploads it.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      studentName: { type: SchemaType.STRING, description: 'Full name of the student.' },
      programName: { type: SchemaType.STRING, description: 'Name of the admitted program.' },
      matriculeNumber: { type: SchemaType.STRING, description: 'Student matriculation number.' },
      registrarEmail: { type: SchemaType.STRING, description: 'Email of the registrar for template signature.' }
    },
    required: ['studentName', 'programName', 'matriculeNumber', 'registrarEmail'],
  },
};

const sendAdmissionEmailFn: FunctionDeclaration = {
  name: 'sendAdmissionEmail',
  description: 'Sends an admission confirmation email with the PDF link to the student.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      toEmail: { type: SchemaType.STRING, description: 'Recipient student email address.' },
      studentName: { type: SchemaType.STRING, description: 'Full name of the student.' },
      programName: { type: SchemaType.STRING, description: 'Name of the program admitted.' },
      matriculeNumber: { type: SchemaType.STRING, description: 'Student matriculation number.' },
      fileUrl: { type: SchemaType.STRING, description: 'URL of the uploaded admission PDF.' }
    },
    required: ['toEmail', 'studentName', 'programName', 'matriculeNumber', 'fileUrl'],
  },
};

// Aggregate Tools
export const tools: Tool[] = [
  { functionDeclarations: [admitStudentFn] },
  { functionDeclarations: [updateStudentRegistrationProccessFn] },
  { functionDeclarations: [getStudentDocumentsFn] },
  { functionDeclarations: [getStudentsFn] },
  { functionDeclarations: [verifiedStudentDocumentFn] },
  { functionDeclarations: [generateAdmissionPdfFn] },
  { functionDeclarations: [sendAdmissionEmailFn] }
];

// Dispatch handler
export async function handleAction(
  name: string,
  args: Record<string, any>
): Promise<ActionResult<any> | any> {
  switch (name as actionType) {
    case 'admitStudent':
      return await admitStudent(args.studentId, args.matriculeNumber);
    case 'updateStudentRegistrationProccess':
      return await updateStudentRegistrationProccess(args.studentId, args.registratioProcess);
    case 'getStudentDocuments':
      return await getStudentDocuments(args.studentId);
    case 'getStudents':
      return await getStudents();
    case 'verifiedStudentDocument':
      return await verifiedStudentDocument(args.documentId, args.verified ?? true);
    case 'generateAdmissionPdf':
      return await generateAdmissionPdf(
        args.studentName,
        args.programName,
        args.matriculeNumber,
        args.registrarEmail
      );
    case 'sendAdmissionEmail':
      return await sendAdmissionEmail(
        args.toEmail,
        args.studentName,
        args.programName,
        args.matriculeNumber,
        args.fileUrl
      );
    default:
      return { success: false, error: 'Action type not allowed' };
  }
}
