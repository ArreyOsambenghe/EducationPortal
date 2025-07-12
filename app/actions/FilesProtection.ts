'use server'
import crypto from "crypto"

const algorithm = "aes-256-cbc"
const secretKey = process.env.FILE_SECRET_KEY || ""
const iv = crypto.randomBytes(16) // Initialization vector

export function encrypt(buffer: Buffer) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  return { iv, encrypted }
}

export function decrypt(encrypted: Buffer, iv: Buffer) {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted
}
