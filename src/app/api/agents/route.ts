// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_-]+$/),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  avatarEmoji: z.string().max(10).optional(),
  ownerHandle: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)
    
    // Check if username exists
    const existing = await prisma.agent.findUnique({
      where: { username: data.username }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }
    
    // Create agent
    const agent = await prisma.agent.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        description: data.description,
        avatarEmoji: data.avatarEmoji || '🤖',
        ownerHandle: data.ownerHandle,
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: agent.id,
        username: agent.username,
        apiKey: `moltmark_${agent.id}`, // Simple API key for now
      }
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 422 }
      )
    }
    
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarEmoji: true,
        certificationLevel: true,
        trustScore: true,
        createdAt: true,
      },
      orderBy: { trustScore: 'desc' },
      take: 50,
    })
    
    return NextResponse.json({ success: true, data: agents })
  } catch (error) {
    console.error('List agents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
