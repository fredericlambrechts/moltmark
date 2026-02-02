// src/app/api/agents/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { username: params.username },
      include: {
        capabilities: {
          select: {
            slug: true,
            name: true,
            description: true,
            status: true,
            confidence: true,
            testCount: true,
            passCount: true,
          }
        }
      }
    })
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: agent })
  } catch (error) {
    console.error('Get agent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
