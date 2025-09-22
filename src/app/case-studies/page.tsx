'use client';

import Link from 'next/link';

export default function CaseStudies() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Hero */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-950 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Case Studies</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">Real results from teams that adopted AI automation.</p>
        </div>
      </section>

      {/* Studies */}
      <section className="py-10">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6 max-w-6xl">
          {[
            { title: 'B2B SaaS: +38% Demo Bookings', summary: 'Outbound powered by AI boosted demos with personalized messaging.' },
            { title: 'Agency: 4x Pipeline in 60 Days', summary: 'Automated lead research and follow-ups multiplied qualified opportunities.' },
            { title: 'Fintech: 22% Faster Close', summary: 'AI-enabled call guidance and follow-up cadences accelerated deals.' },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl border border-gray-700 bg-gray-800/40 p-6 hover:border-purple-500/60 transition-colors">
              <h3 className="text-xl font-bold text-purple-200 mb-2">{s.title}</h3>
              <p className="text-gray-300">{s.summary}</p>
              <Link href="/demo" className="mt-4 inline-block text-purple-300 hover:text-white">See How</Link>
            </div>
          ))}
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