// src/app/api/telemetry/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db'
import { z } from 'zod'

const telemetrySchema = z.object({
  agentId: z.string().uuid(),
  eventType: z.enum(['TOOL_CALL', 'TOOL_RESULT', 'DECISION', 'ERROR', 'SESSION_START', 'SESSION_END']),
  payload: z.record(z.any()),
  sessionId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = telemetrySchema.parse(body)
    
    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId }
    })
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Store telemetry
    const event = await prisma.telemetry.create({
      data: {
        agentId: data.agentId,
        eventType: data.eventType,
        payload: data.payload,
        sessionId: data.sessionId,
      }
    })
    
    return NextResponse.json({ success: true, data: event }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 422 }
      )
    }
    
    console.error('Telemetry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
