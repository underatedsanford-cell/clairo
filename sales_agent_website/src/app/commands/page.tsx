'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { allCommands, getAllCategories, searchCommands } from './data';

export default function CommandsIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const categories = useMemo(() => getAllCategories(), []);
  
  const filteredCommands = useMemo(() => {
    let results = allCommands;
    
    // Apply search filter
    if (searchQuery.trim()) {
      results = searchCommands(searchQuery);
    }
    
    // Apply category filter
    if (selectedCategory) {
      results = results.filter(cmd => cmd.category === selectedCategory);
    }
    
    return results;
  }, [searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen text-white px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          Features Directory
        </h1>
        <p className="text-gray-300 mb-10 max-w-3xl">
          Explore all features available in the platform. These mirror the capabilities you may know from the Discord bot, presented with website-first details and workflows.
        </p>
        
        {/* Search and Filter Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mb-6 text-sm text-gray-400">
          Showing {filteredCommands.length} of {allCommands.length} features
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommands.map(cmd => (
            <Link key={cmd.slug} href={`/commands/${cmd.slug}`} className="block bg-gray-800/40 border border-gray-700 p-6 rounded-xl hover:border-purple-500/60 transition-all">
              <h3 className="text-xl font-semibold text-purple-200 mb-2">{cmd.title}</h3>
              <p className="text-gray-300 text-sm mb-3">{cmd.shortDescription || cmd.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Category: {cmd.category || 'General'}</span>
                {cmd.tags && cmd.tags.length > 0 && (
                  <div className="flex gap-1">
                    {cmd.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-700/60 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {cmd.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-700/60 rounded text-xs">
                        +{cmd.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {/* No results message */}
        {filteredCommands.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No features found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}