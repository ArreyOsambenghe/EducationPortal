"use server"
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
const key = new TextEncoder().encode(process.env.JWT_SECRET)

const cookie = {
    name: 'authSession',
    options: { httpOnly: true, secure: true, sameSite: 'lax' as 'lax', path: '/' },
    duration: 24 * 60 * 60 * 1000
}
type authCookieData = {
    email: string,
    role: string,
}
export async function encryptAuth(payload: { user: authCookieData, expires: Date }) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key)
}
export async function decryptAuth(session: string) {
    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        })
        return payload as { user: authCookieData, expires: Date }
    } catch (error) {
        return null
    }
}

export async function createAuthSession(user: authCookieData) {
    const expires = new Date(Date.now() + cookie.duration)
    const session = await encryptAuth({ user, expires })
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, session, { ...cookie.options, expires });
}

export async function verifyAuthSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get(cookie.name)?.value;
    if (!session) return null
    const decrypted = await decryptAuth(session)
    if (!decrypted) return null
    const { user, expires } = decrypted
    if (new Date() > new Date(expires)) return null
    return user
}

export async function deleteAuthSession() {
    const cookieStore = await cookies();
    cookieStore.delete(cookie.name);
}
