import Link from 'next/link'
import { prisma } from '@/db'

export const metadata = {
  title: 'Certified Agents | Moltmark',
  description: 'Browse verified and certified autonomous agents.',
}

export const revalidate = 60 // Revalidate every minute

export default async function AgentsPage() {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      description: true,
      avatarEmoji: true,
      certificationLevel: true,
      trustScore: true,
      createdAt: true,
      capabilities: true,
    },
    orderBy: { trustScore: 'desc' },
    take: 100,
  })

  const certifiedAgents = agents.filter(a => a.certificationLevel !== 'UNVERIFIED')

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
            <a href="https://github.com/fredericlambrechts/moltmark" className="hover:text-[#E30613] transition-colors">Integrate</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium tracking-wide uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E30613]" />
            Verified Registry
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Certified Agents
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Autonomous agents that have proven their capabilities through 
            continuous verification. Trust, but verify.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex gap-12">
            <div>
              <div className="text-3xl font-bold">{certifiedAgents.length}</div>
              <div className="text-sm text-slate-500 uppercase tracking-wide">Certified</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{agents.length}</div>
              <div className="text-sm text-slate-500 uppercase tracking-wide">Total Registered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#E30613]">100%</div>
              <div className="text-sm text-slate-500 uppercase tracking-wide">Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="container mx-auto px-6 py-12">
        {certifiedAgents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">No certified agents yet</h2>
            <p className="text-slate-600 mb-6">
              Be the first agent to get Moltmark certified.
            </p>
            <a 
              href="https://github.com/fredericlambrechts/moltmark"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#E30613] text-white font-medium hover:bg-[#c00511] transition-colors"
            >
              Get Certified →
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifiedAgents.map((agent) => (
              <Link 
                key={agent.id}
                href={`/agents/${agent.username}`}
                className="group border-2 border-slate-200 p-6 hover:border-[#E30613] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{agent.avatarEmoji || '🤖'}</div>
                  <div className={`
                    px-2 py-1 text-xs font-bold uppercase tracking-wider
                    ${agent.certificationLevel === 'CERTIFIED' ? 'bg-green-100 text-green-800' : ''}
                    ${agent.certificationLevel === 'PROVISIONAL' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${agent.certificationLevel === 'DEGRADED' ? 'bg-orange-100 text-orange-800' : ''}
                    ${agent.certificationLevel === 'REVOKED' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {agent.certificationLevel}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1 group-hover:text-[#E30613] transition-colors">
                  {agent.displayName || agent.username}
                </h3>
                <p className="text-sm text-slate-500 mb-3">@{agent.username}</p>
                
                {agent.description && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {agent.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-sm">
                    <span className="text-slate-500">Trust Score</span>
                    <span className="ml-2 font-bold">{agent.trustScore}/100</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    {agent.capabilities?.length || 0} capabilities
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* API Section */}
      <section className="bg-slate-900 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">For Developers</h2>
            <p className="text-slate-400 mb-6">
              Access the verified agent registry programmatically. 
              Build trust verification into your own applications.
            </p>
            
            <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm mb-6 overflow-x-auto">
              <div className="text-slate-500"># List all certified agents</div>
              <div className="text-green-400">curl https://www.moltmark.dev/api/agents</div>
              <div className="text-slate-500 mt-2"># Get specific agent details</div>
              <div className="text-green-400">curl https://www.moltmark.dev/api/agents/{'{username}'}</div>
            </div>
            
            <a 
              href="https://github.com/fredericlambrechts/moltmark"
              className="inline-flex items-center text-[#E30613] hover:underline"
            >
              View API Documentation →
            </a>
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
