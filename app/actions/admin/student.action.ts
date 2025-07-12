'use server';
import prisma from "@/app/lib/prisma";
import { ActionResult, createActionResult } from "../base-actions";
import { File as PrismaFile, Student, UserFile } from "@/app/generated/prisma";
import Admision_Template from "@/app/static/Admision_Template";
import { FileUploadMetada, UploadService } from "@/app/services/UploadService";
import puppeteer from "puppeteer";
import nodemailer from 'nodemailer';
export const admitStudent = async (studentId: string, matriculeNumber: string): Promise<ActionResult<Student>> => {
  try {
    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        registratioProcess: 'admitted',
        matriculationNumber:matriculeNumber,
      },
    });

    return createActionResult(true, student);
  } catch (error) {
    console.error("Error admitting student:", error);
    return { success: false, error: 'Failed to admit student' };
  }
}
export const updateStudentRegistrationProccess = async (studentId: string, registratioProcess: string):Promise<ActionResult<Student>> => {
  try {
    const student = await prisma.student.update({
      where: { id: studentId },
      data: { registratioProcess },
    });

    return createActionResult(true,student);
  } catch (error) {
    console.error("Error admitting student:", error);
    return {success:false,error:'Failed to update the process'}
  }
}

export const getStudentDocuments = async (studentId: string): Promise<ActionResult<UserFile[]>> => {
  try {
    const files = await prisma.userFile.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    return createActionResult(true, files);
  } catch (error) {
    console.error("Error fetching student documents:", error);
    return { success: false, error: 'Failed to fetch student documents' };
  }
}
export const getStudents = async (): Promise<ActionResult<(Student & { admisionRequestDocument: (UserFile & { file: PrismaFile })[] })[]>> => {
  try {
    const students = await prisma.student.findMany({
      
      orderBy: { createdAt: 'desc' },
      include: {
        admisionRequestDocument: {
          orderBy: { createdAt: 'desc' },
          include: {
            file: true,
          },
        },
      },
    });    
    return createActionResult(true, students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, error: 'Failed to fetch students' };
  }
}
export const verifiedStudentDocument = async (documentId:string,verified:boolean = true):Promise<ActionResult<UserFile>> => {
    try {
        const file  = await prisma.userFile.update({
            where:{id:documentId},
            data:{
                verify:true
            }
        }) 
        return createActionResult(true,file)
    } catch (error) {
        console.log('Error in updating file ',error)
        return {success:false,error:'Failed to update process'}
    }
}
export const veryfiedDocument = async (documentId:string,verified:boolean = true):Promise<ActionResult<UserFile>> => {
    try {
        const file  = await prisma.userFile.update({
            where:{id:documentId},
            data:{
                verify:verified
            }
        }) 
        return createActionResult(true,file)
    } catch (error) {
        console.log('Error in updating file ',error)
        return {success:false,error:'Failed to update process'}
    }
}

export const generateAdmissionPdf = async (studentName:string,programName:string,matriculeNumber:string,registrarEamil:string): Promise<ActionResult<FileUploadMetada>> => {
    const name = await prisma.admin.findFirst({
        where: { email: registrarEamil },
        select: { firstName: true, lastName: true },
    });
  const filled = Admision_Template
        .replace('{{studentName}}', studentName)
        .replace('{{program}}', programName)
        .replace('{{matriculeNumber}}', matriculeNumber)
        .replace(/{{admissionYear}}/g, new Date().getFullYear().toString())
        .replace('{{registrarName}}', `${name?.firstName} ${name?.lastName}`)
        .replace(/{{currentDate}}/g, new Date().toLocaleDateString())

        const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(filled, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'a4', printBackground: true });
  await browser.close();

  // Convert Node.js Buffer to ArrayBuffer
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  );

  const fileName = `admission_${matriculeNumber}_${Date.now()}.pdf`;
  const file = new File([arrayBuffer as BlobPart], fileName, { type: 'application/pdf' });

  // 4. Upload the File object to your storage service
  const uploadResult = await UploadService.uploadFile(file);
  if (!uploadResult.success) {
    return { success: false, error: 'Failed to upload the admission PDF' };
  }
  return createActionResult(true,uploadResult.metadata)
    
}


export async function sendAdmissionEmail(
  toEmail: string,
  studentName: string,
  programName: string,
  matriculeNumber: string,
  fileUrl: string,
):Promise<ActionResult<boolean>> {
  const htmlContent = `Your HTML with ${studentName}, ${programName}, ${matriculeNumber}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'choclark6@gmail.com',
      pass: process.env.EMAIL_SERVICE_PASSWORD, // Use environment variable for security
    },
  });

  const mailOptions = {
    from: 'choclark6@gmail.com',
    to: toEmail,
    subject: 'Admission Confirmation',
    text: `Hello ${studentName},\n\nPlease download your admission letter here: ${fileUrl}`,
    html: `<p>Hello ${studentName},</p>
           <p>Please download your admission letter here:</p>
           <a href="${fileUrl}">${fileUrl}</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent with PDF link');
    return createActionResult(true,true);
  } catch (error) {
    console.log('Error sending email:', error);
    return { success: false, error: 'Failed to send admission email'};
  }
}
