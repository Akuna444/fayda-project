import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';
import { auth } from '@/lib/auth'; // Your Better Auth instance

const prisma = new PrismaClient();

// Revalidate every 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {

    
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        points: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      points: user.points,
      email: user.email
    });
  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}