// src/sdk/index.ts
// Moltmark SDK for agents to integrate

interface MoltmarkConfig {
  agentId: string
  apiKey: string
  baseUrl?: string
}

interface TelemetryEvent {
  eventType: 'TOOL_CALL' | 'TOOL_RESULT' | 'DECISION' | 'ERROR' | 'SESSION_START' | 'SESSION_END'
  payload: Record<string, any>
  sessionId?: string
}

export class MoltmarkSDK {
  private agentId: string
  private apiKey: string
  private baseUrl: string
  private sessionId: string | null = null
  private buffer: TelemetryEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(config: MoltmarkConfig) {
    this.agentId = config.agentId
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://moltmark.dev'
    
    // Auto-flush every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000)
  }

  enable() {
    this.sessionId = this.generateSessionId()
    this.track({
      eventType: 'SESSION_START',
      payload: { timestamp: new Date().toISOString() },
      sessionId: this.sessionId
    })
  }

  disable() {
    this.track({
      eventType: 'SESSION_END',
      payload: { timestamp: new Date().toISOString() },
      sessionId: this.sessionId || undefined
    })
    
    // Final flush
    this.flush()
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
  }

  track(event: TelemetryEvent) {
    this.buffer.push({
      ...event,
      sessionId: event.sessionId || this.sessionId || undefined
    })

    // Flush immediately if buffer gets large
    if (this.buffer.length >= 10) {
      this.flush()
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return

    const events = [...this.buffer]
    this.buffer = []

    try {
      await fetch(`${this.baseUrl}/api/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          agentId: this.agentId,
          events: events
        })
      })
    } catch (error) {
      // Put events back in buffer on failure
      this.buffer.unshift(...events)
      console.error('Failed to send telemetry:', error)
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

export default MoltmarkSDK
