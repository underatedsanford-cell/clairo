import React from 'react';
import Link from 'next/link';

const AnalyticsPage = () => {
  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-900">
      <section className="pt-24 pb-8 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Analytics</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">This is the analytics page. Charts and data will be displayed here.</p>
          <div className="mt-6 flex justify-center">
            <Link href="/commands/dashboard" className="px-4 py-2 text-sm bg-purple-600/20 border border-purple-500/40 rounded-lg text-purple-200 hover:bg-purple-600/30 transition-colors">
              📊 Learn about Dashboard Features
            </Link>
          </div>
        </div>
      </section>
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-700 bg-gray-800/40 p-6">
                <div className="h-40 bg-gray-900/60 rounded-xl border border-gray-700 mb-4"></div>
                <h3 className="text-xl font-semibold text-purple-200 mb-2">Analytics Card {i}</h3>
                <p className="text-gray-300">Placeholder for chart or KPI visualization.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;