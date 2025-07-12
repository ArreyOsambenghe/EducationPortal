import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import prisma from "@/app/lib/prisma"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Create uploads directory if not exists
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  // Generate unique file name
  const timestamp = Date.now()
  const originalName = file.name
  const extension = path.extname(originalName)
  const fileName = `${timestamp}-${originalName}`
  const filePath = path.join(uploadDir, fileName)

  // Save file
  fs.writeFileSync(filePath, buffer)

  // Generate URL
  const fileUrl = `/uploads/${fileName}`

  // Prepare metadata
   const dbFile = await prisma.file.create({
    data:{
      originalName,
      fileName,
      fileUrl,
      size: file.size,
      type: file.type,
      extension,
    }
  })

  const metadata = {
    id:dbFile.id,
    originalName,
    fileName,
    fileUrl,
    size: file.size,
    type: file.type,
    extension,
    uploadDate: new Date().toISOString(),
  }

  return NextResponse.json({ metadata })
}
