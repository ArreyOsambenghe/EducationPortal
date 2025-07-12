import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: {
        levels: {
          include: {
            semesters: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: programs
    });
  } catch (error) {
    console.error('Error fetching academic data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch academic data'
    }, { status: 500 });
  }
}
