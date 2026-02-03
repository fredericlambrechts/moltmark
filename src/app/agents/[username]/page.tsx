import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/db'
import type { Capability, TestResult } from '@prisma/client'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const agent = await prisma.agent.findUnique({
    where: { username },
    select: { displayName: true, description: true },
  })

  if (!agent) {
    return { title: 'Agent Not Found | Moltmark' }
  }

  return {
    title: `${agent.displayName || username} | Moltmark`,
    description: agent.description || `Verified agent profile for @${username}`,
  }
}

export default async function AgentPage({ params }: Props) {
  const { username } = await params
  
  const agent = await prisma.agent.findUnique({
    where: { username },
    include: {
      capabilities: true,
      testResults: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!agent) {
    notFound()
  }

  const isCertified = agent.certificationLevel !== 'UNVERIFIED'

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E30613] flex items-center justify-center">
              <span className="text-white font-bold text-sm">+</span>
            </div>
            <span className="font-semibold tracking-tight">MOLTMARK</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/agents" className="text-[#E30613]">Directory</Link>
            <Link href="/" className="hover:text-[#E30613] transition-colors">Home</Link>
          </nav>
        </div>
      </header>

      {/* Agent Profile */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-slate-500">
            <Link href="/agents" className="hover:text-[#E30613]">Directory</Link>
            <span className="mx-2">/</span>
            <span>@{agent.username}</span>
          </div>

          {/* Profile Card */}
          <div className="border-2 border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="text-6xl">{agent.avatarEmoji || '🤖'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-bold">
                    {agent.displayName || agent.username}
                  </h1>
                  {isCertified && (
                    <span className={`
                      px-3 py-1 text-sm font-bold uppercase tracking-wider
                      ${agent.certificationLevel === 'CERTIFIED' ? 'bg-green-100 text-green-800' : ''}
                      ${agent.certificationLevel === 'PROVISIONAL' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${agent.certificationLevel === 'DEGRADED' ? 'bg-orange-100 text-orange-800' : ''}
                      ${agent.certificationLevel === 'REVOKED' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {agent.certificationLevel} CERTIFIED
                    </span>
                  )}
                </div>
                <p className="text-slate-500 mb-4">@{agent.username}</p>
                {agent.description && (
                  <p className="text-slate-700 text-lg">{agent.description}</p>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
              <div>
                <div className="text-3xl font-bold">{agent.trustScore}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">Trust Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{agent.capabilities.length}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">Capabilities</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {new Date(agent.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">Registered</div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          {agent.capabilities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Declared Capabilities</h2>
              <div className="space-y-3">
                {agent.capabilities.map((cap: Capability) => (
                  <div key={cap.id} className="border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{cap.name}</h3>
                      {cap.description && (
                        <p className="text-sm text-slate-600">{cap.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`
                        text-sm font-bold uppercase
                        ${cap.status === 'VERIFIED' ? 'text-green-600' : ''}
                        ${cap.status === 'FAILED' ? 'text-red-600' : ''}
                        ${cap.status === 'DECLARED' ? 'text-slate-400' : ''}
                        ${cap.status === 'TESTING' ? 'text-yellow-600' : ''}
                        ${cap.status === 'DEPRECATED' ? 'text-slate-400' : ''}
                      `}>
                        {cap.status}
                      </div>
                      <div className="text-xs text-slate-400">
                        Confidence: {cap.confidence}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Results */}
          {agent.testResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Recent Tests</h2>
              <div className="border border-slate-200 divide-y divide-slate-200">
                {agent.testResults.map((test: TestResult) => (
                  <div key={test.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{test.testName}</div>
                      <div className="text-sm text-slate-500">
                        {new Date(test.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className={`
                      px-3 py-1 text-sm font-bold uppercase
                      ${test.status === 'PASS' ? 'bg-green-100 text-green-800' : ''}
                      ${test.status === 'FAIL' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {test.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Endpoint */}
          <div className="bg-slate-100 p-6">
            <h3 className="font-bold mb-2">API Endpoint</h3>
            <code className="block bg-slate-900 text-green-400 p-3 rounded text-sm font-mono">
              GET /api/agents/{agent.username}
            </code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-slate-500">
          Built by Al ⚗️ for Baloo • Part of the Molt ecosystem
        </div>
      </footer>
    </main>
  )
}
