export default function Features() {
  const featureCards = [
    {
      icon: '🤖',
      title: 'Autonomous Outreach',
      desc: 'AI plans and executes personalized multi-channel outreach across email, SMS, and calls.'
    },
    {
      icon: '🧠',
      title: 'Lead Research',
      desc: 'Discovers and qualifies leads with web search, enrichment, and scoring.'
    },
    {
      icon: '⚡',
      title: 'Workflow Automation',
      desc: 'Trigger workflows from events, with guardrails, approvals, and audit logs.'
    },
    {
      icon: '📈',
      title: 'Analytics & Insights',
      desc: 'Real-time dashboards with conversion trends and funnel optimization hints.'
    },
    {
      icon: '🔗',
      title: 'Deep Integrations',
      desc: 'Connect your CRM, messaging, scheduling, and telephony tools in minutes.'
    },
    {
      icon: '🔒',
      title: 'Security & SSO',
      desc: 'Role-based access, audit logs, SAML/SSO, and field-level permissions.'
    },
  ];

  const integrations = [
    { name: 'Slack', color: 'from-purple-400 to-indigo-400' },
    { name: 'Discord', color: 'from-indigo-400 to-blue-400' },
    { name: 'Calendly', color: 'from-sky-400 to-cyan-400' },
    { name: 'HubSpot', color: 'from-orange-400 to-yellow-500' },
    { name: 'Salesforce', color: 'from-blue-400 to-sky-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Hero */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-950 text-center animate-section">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Features</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">Everything you need to research, reach, and close — powered by AI.</p>
          <div className="mt-6">
            <a href="/feature-sheet.pdf" download className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition-all hover:scale-105">
              📄 Download Feature Sheet
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-10 animate-section">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6 max-w-6xl">
          {featureCards.map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-700 bg-gray-800/40 p-6 hover:border-purple-500/60 transition-colors">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-xl font-bold text-purple-200 mb-2">{f.title}</h3>
              <p className="text-gray-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Badges */}
      <section className="py-10 bg-gray-800/30 animate-section">
        <div className="container mx-auto px-4 text-center max-w-5xl">
          <h2 className="text-3xl font-bold mb-6">Integrates with your stack</h2>
          <p className="text-gray-300 mb-6">One-click connectors for your favorite tools.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {integrations.map((i) => (
              <div key={i.name} className={`text-sm font-semibold px-3 py-2 rounded-xl border border-gray-700 bg-gray-900/50 hover:scale-105 transition-transform shadow-sm`}> 
                <span className={`bg-gradient-to-r ${i.color} bg-clip-text text-transparent`}>{i.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-950 border-t border-gray-800 text-center text-gray-400">
        <div className="container mx-auto px-4">
          <p>© 2024 Clairo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}