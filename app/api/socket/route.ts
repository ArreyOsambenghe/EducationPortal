// app/api/socket/route.ts
import { NextRequest } from 'next/server'
import { NextApiResponseServerIO, initializeSocketServer } from '@/app/lib/socket.server'

export const dynamic = 'error'

export async function GET(req: Request, res: any) {
  try {
    const io = initializeSocketServer(res);
    // Proceed with your logic
    return new Response("Socket.IO initialized.");
  } catch (error) {
    console.error("Socket initialization error:", error);
    return new Response("Socket.IO failed to initialize.", { status: 500 });
  }
}
