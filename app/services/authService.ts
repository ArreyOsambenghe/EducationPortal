import { Admin, Student, Teacher } from "../generated/prisma";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

type AdminData = Omit<Admin, "id" | "createdAt" | "updatedAt" | "role" |"status"| "registratioProcess"> 
type StudentData = Omit<Student, "id" | "createdAt" | "updatedAt"|'status'| "registratioProcess"| "programId" | "matriculationNumber"> 
type TeacherData = Omit<Teacher, "id" | "createdAt" | "updatedAt"| "status"| "registratioProcess" > 
export class AuthService {
    AuthService() {}



    static async createAdmin(admin:AdminData): Promise< {success: boolean, message: string, admin?: Admin, error?: any}> {
        try {
            const existingAdmin = await prisma.admin.findUnique({
                where: {email: admin.email}
            });
            if (existingAdmin) {
                return {success: false, message: "Admin with this email already exists"};
            }
            const hashedPassword = await bcrypt.hash(admin.password, 10);
            const newAdmin = await prisma.admin.create({
                data:{
                    ...admin,
                    password: hashedPassword,
                    role:'superadmin',
                    registratioProcess: 'pending',
                }
            })
            return {success: true, message: "Admin created successfully", admin: newAdmin};
        } catch (error) {
            return {success: false, message: "Error creating admin", error};
        }

    }

    static async createStudent(student:StudentData): Promise< {success: boolean, message: string, student?: Student, error?: any}> {
        try {
            const existingStudent = await prisma.student.findUnique({
                where: {email: student.email}
            });
            if (existingStudent) {
                return {success: false, message: "Student with this email already exists"};
            }
            const hashedPassword = await bcrypt.hash(student.password, 10);
            const newStudent = await prisma.student.create({
                data:{
                    ...student,
                    password: hashedPassword,
                    registratioProcess: 'pending',

                }
            })
            return {success: true, message: "Student created successfully", student: newStudent};
        } catch (error) {
            return {success: false, message: "Error creating student", error};
        }

    }

    static async createTeacher(teacher:TeacherData): Promise< {success: boolean, message: string, teacher?: Teacher, error?: any}> {
        try {
            const existingTeacher = await prisma.teacher.findUnique({
                where: {email: teacher.email}
            });
            if (existingTeacher) {
                return {success: false, message: "Teacher with this email already exists"};
            }
            const hashedPassword = await bcrypt.hash(teacher.password, 10);
            const newTeacher = await prisma.teacher.create({
                data:{
                    ...teacher,
                    password: hashedPassword,
                    registratioProcess: 'pending',
                }
            })
            return {success: true, message: "Teacher created successfully", teacher: newTeacher};
        } catch (error) {
            return {success: false, message: "Error creating teacher", error};
        }

    }
    static async loginUser(email: string, password: string, role: 'superadmin' | 'student' | 'teacher'): Promise<{ success: boolean, message: string, user?: any, error?: any }> {
        try {
            let user;
            console.log(role)
            if (role === 'superadmin') {
                user = await prisma.admin.findUnique({ where: { email  } });
            } else if (role === 'student') {
                user = await prisma.student.findUnique({ where: { email } });
            } else if (role === 'teacher') {
                user = await prisma.teacher.findUnique({ where: { email } });
            }

            if (!user) {
                return { success: false, message: "User not found" };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return { success: false, message: "Invalid password" };
            }

            return { success: true, message: "Login successful", user };
        } catch (error) {
            return { success: false, message: "Error logging in", error };
        }
    }
    static async updateAdmin(id: string, adminData: Partial<Admin>): Promise<{ success: boolean, message: string, admin?: Admin, error?: any }> {
       
        const updatedAdmin = await prisma.admin.update({
            where: { id },
            data: {
                firstName: adminData.firstName,
                lastName: adminData.lastName,
                email: adminData.email,
                password: adminData.password,
                role: adminData.role,
                registratioProcess: adminData.registratioProcess,
                status: adminData.status,
                phoneNumber: adminData.phoneNumber,
                dof: adminData.dof,
                sex: adminData.sex,
                address: adminData.address,
                nationality: adminData.nationality,
            },
            
        });
        if(updatedAdmin){
            return { success: true, message: "Admin updated successfully", admin: updatedAdmin };
        }
        return { success: false, message: "Error updating admin" };
    }
    static async updateStudent(id: string, studentData: Partial<Student>): Promise<{ success: boolean, message: string, student?: Student, error?: any }> {
        const updatedStudent = await prisma.student.update({
            where: { id },
            data: studentData
        });
        if(updatedStudent){
            return { success: true, message: "Student updated successfully", student: updatedStudent };
        }
        return { success: false, message: "Error updating student" };
    }
    static async updateTeacher(id: string, teacherData: Partial<Teacher>): Promise<{ success: boolean, message: string, teacher?: Teacher, error?: any }> {
        const updatedTeacher = await prisma.teacher.update({
            where: { id },
            data: teacherData
        });
        if(updatedTeacher){
            return { success: true, message: "Teacher updated successfully", teacher: updatedTeacher };
        }
        return { success: false, message: "Error updating teacher" };
    }
}

