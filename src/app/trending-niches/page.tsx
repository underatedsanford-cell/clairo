import React from 'react';

const TrendingNichesPage = () => {
  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-900">
      <section className="pt-24 pb-8 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Top Trending Niches</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">This page will display top trending niches in real time.</p>
        </div>
      </section>
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-700 bg-gray-800/40 p-6">
                <h3 className="text-xl font-semibold text-purple-200 mb-2">Niche {i}</h3>
                <p className="text-gray-300">Placeholder for niche description or details.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TrendingNichesPage;