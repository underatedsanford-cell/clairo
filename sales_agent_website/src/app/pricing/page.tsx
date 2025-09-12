'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Pricing() {
  const [yearly, setYearly] = useState(true);

  const prices = {
    Free: { m: 0, y: 0, features: ['100 AI actions/mo', 'Basic CRM export', 'Email support'] },
    Pro: { m: 49, y: 39, features: ['Unlimited AI actions', 'All integrations', 'Priority support', 'Advanced analytics'] },
    Enterprise: { m: 199, y: 149, features: ['Custom limits', 'SAML/SSO', 'Dedicated manager', 'Onboarding & SLAs'] },
  } as const;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Hero */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-950 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Pricing</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">Simple, transparent plans that scale with you.</p>
        </div>
      </section>

      {/* Toggle */}
      <section className="py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-2">
            <span className={!yearly ? 'text-purple-300 font-semibold' : 'text-gray-400'}>Monthly</span>
            <button onClick={() => setYearly(!yearly)} className="relative w-16 h-8 bg-gray-700 rounded-full p-1">
              <span className={`absolute top-1 ${yearly ? 'right-1' : 'left-1'} inline-block w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all`}></span>
            </button>
            <span className={yearly ? 'text-purple-300 font-semibold' : 'text-gray-400'}>Yearly <span className="ml-1 text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">Save 20%</span></span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-10">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6 max-w-6xl">
          {Object.entries(prices).map(([name, plan], idx) => (
            <div key={name} className={`relative rounded-2xl border ${idx === 1 ? 'border-purple-500/60 bg-purple-900/10 shadow-xl' : 'border-gray-700 bg-gray-800/30'} p-6 flex flex-col`}>
              {idx === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Best Value</span>
              )}
              <h3 className="text-2xl font-bold mb-2">{name}</h3>
              <p className="text-4xl font-extrabold mb-4">
                ${yearly ? plan.y : plan.m}
                <span className="text-sm text-gray-400 font-medium">/mo</span>
              </p>
              <ul className="space-y-2 text-gray-300 mb-6">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/support" className={`mt-auto text-center ${idx === 1 ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'border-2 border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white'} font-bold py-3 px-6 rounded-full transition-all`}>Get Started</Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-gray-800/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Billing FAQs</h2>
          <div className="divide-y divide-gray-700">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel at any time from your account settings.' },
              { q: 'Do you offer discounts?', a: 'We offer yearly discounts and custom pricing for enterprises.' },
              { q: 'Is there a free trial?', a: 'Yes, the Free plan lets you explore core features before upgrading.' },
            ].map((item) => (
              <details key={item.q} className="py-4 group">
                <summary className="cursor-pointer text-lg font-semibold text-gray-200 group-open:text-purple-300">{item.q}</summary>
                <p className="mt-2 text-gray-400">{item.a}</p>
              </details>
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