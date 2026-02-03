import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db'

// Certification evaluation criteria
const CRITERIA = {
  PROVISIONAL: {
    minTests: 10,
    minPassRate: 0.70,
    maxAgeDays: 30,
  },
  CERTIFIED: {
    minTests: 50,
    minPassRate: 0.95,
    minAgeDays: 30,
    maxRecentFailures: 2, // in last 10 tests
  },
  DEGRADED: {
    minRecentFailures: 3, // in last 10 tests
    maxPassRate: 0.90,
  },
  REVOKED: {
    minRecentFailures: 5, // in last 10 tests
    maxPassRate: 0.50,
  },
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username required' },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.findUnique({
      where: { username },
      include: {
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        capabilities: true,
      },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Calculate metrics
    const totalTests = agent.testResults.length
    const passedTests = agent.testResults.filter(t => t.status === 'PASS').length
    const passRate = totalTests > 0 ? passedTests / totalTests : 0
    
    const recentTests = agent.testResults.slice(0, 10)
    const recentFailures = recentTests.filter(t => t.status === 'FAIL').length
    
    const ageDays = (Date.now() - new Date(agent.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    
    const testedCapabilities = new Set(agent.testResults.map(t => t.capabilityId)).size
    const totalCapabilities = agent.capabilities.length
    const coverage = totalCapabilities > 0 ? testedCapabilities / totalCapabilities : 0

    // Determine certification level
    let newLevel = agent.certificationLevel
    let reasons: string[] = []

    // Check for REVOKED first (worst case)
    if (passRate < CRITERIA.REVOKED.maxPassRate || recentFailures >= CRITERIA.REVOKED.minRecentFailures) {
      newLevel = 'REVOKED'
      reasons.push(`Pass rate ${(passRate * 100).toFixed(1)}% below ${CRITERIA.REVOKED.maxPassRate * 100}%`)
      reasons.push(`${recentFailures} recent failures in last 10 tests`)
    }
    // Check for DEGRADED
    else if (recentFailures >= CRITERIA.DEGRADED.minRecentFailures || passRate < CRITERIA.DEGRADED.maxPassRate) {
      newLevel = 'DEGRADED'
      reasons.push(`${recentFailures} recent failures detected`)
      reasons.push(`Pass rate declined to ${(passRate * 100).toFixed(1)}%`)
    }
    // Check for CERTIFIED
    else if (
      totalTests >= CRITERIA.CERTIFIED.minTests &&
      passRate >= CRITERIA.CERTIFIED.minPassRate &&
      ageDays >= CRITERIA.CERTIFIED.minAgeDays &&
      recentFailures <= CRITERIA.CERTIFIED.maxRecentFailures &&
      coverage >= 0.8 // At least 80% of capabilities tested
    ) {
      newLevel = 'CERTIFIED'
      reasons.push(`Pass rate ${(passRate * 100).toFixed(1)}% exceeds ${CRITERIA.CERTIFIED.minPassRate * 100}%`)
      reasons.push(`${totalTests} tests completed over ${ageDays.toFixed(0)} days`)
      reasons.push(`${(coverage * 100).toFixed(0)}% capability coverage`)
    }
    // Check for PROVISIONAL
    else if (
      totalTests >= CRITERIA.PROVISIONAL.minTests &&
      passRate >= CRITERIA.PROVISIONAL.minPassRate &&
      ageDays <= CRITERIA.PROVISIONAL.maxAgeDays
    ) {
      newLevel = 'PROVISIONAL'
      reasons.push(`Pass rate ${(passRate * 100).toFixed(1)}% meets minimum ${CRITERIA.PROVISIONAL.minPassRate * 100}%`)
      reasons.push(`Agent is ${ageDays.toFixed(0)} days old (provisional period)`)
    }
    // Otherwise UNVERIFIED
    else {
      newLevel = 'UNVERIFIED'
      if (totalTests < CRITERIA.PROVISIONAL.minTests) {
        reasons.push(`Only ${totalTests} tests run (need ${CRITERIA.PROVISIONAL.minTests})`)
      }
      if (passRate < CRITERIA.PROVISIONAL.minPassRate) {
        reasons.push(`Pass rate ${(passRate * 100).toFixed(1)}% below ${CRITERIA.PROVISIONAL.minPassRate * 100}%`)
      }
    }

    // Calculate trust score (0-100)
    const trustScore = Math.round(
      (passRate * 40) +                          // 40% weight on pass rate
      (Math.min(coverage, 1) * 20) +             // 20% weight on coverage
      (Math.min(totalTests / 100, 1) * 20) +     // 20% weight on test volume
      ((1 - Math.min(recentFailures / 10, 1)) * 20) // 20% weight on recency
    )

    // Update agent
    const updated = await prisma.agent.update({
      where: { username },
      data: {
        certificationLevel: newLevel,
        trustScore,
        lastCertifiedAt: new Date(),
        certificationExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        username: agent.username,
        previousLevel: agent.certificationLevel,
        newLevel: updated.certificationLevel,
        trustScore: updated.trustScore,
        metrics: {
          totalTests,
          passRate: Math.round(passRate * 100),
          recentFailures,
          ageDays: Math.round(ageDays),
          capabilityCoverage: Math.round(coverage * 100),
        },
        reasons,
        certifiedAt: updated.lastCertifiedAt,
        expiresAt: updated.certificationExpires,
      },
    })

  } catch (error) {
    console.error('Certification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get certification criteria
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      criteria: CRITERIA,
      scoring: {
        passRateWeight: 40,
        coverageWeight: 20,
        volumeWeight: 20,
        recencyWeight: 20,
      },
    },
  })
}
