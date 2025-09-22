'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';

interface Testimonial {
  id: number;
  name: string;
  company: string;
  testimonial: string;
  created_at: string;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTestimonials();

    const subscription = supabase
      .channel('testimonials')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'testimonials' }, (payload) => {
        setTestimonials((prev) => [...prev, payload.new as Testimonial]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchTestimonials() {
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching testimonials:', error);
    } else {
      setTestimonials(data || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('testimonials').insert([{ name, company, testimonial }]);
    if (error) {
      console.error('Error submitting testimonial:', error);
    } else {
      setName('');
      setCompany('');
      setTestimonial('');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Hero */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-950 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Testimonials</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">See what our customers are saying about us.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6 max-w-4xl">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-2xl border border-gray-700 bg-gray-800/40 p-6 hover:border-purple-500/60 transition-colors">
              <p className="text-gray-300 mb-4">{`“${t.testimonial}”`}</p>
              <div className="text-right">
                <p className="font-bold text-purple-200">{t.name}</p>
                <p className="text-sm text-gray-400">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="py-12 bg-gray-800/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Leave a Testimonial</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md bg-gray-900/50 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                required
              />
              <input
                type="text"
                placeholder="Company (Optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-md bg-gray-900/50 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <textarea
              rows={4}
              placeholder="Your testimonial..."
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              className="w-full rounded-md bg-gray-900/50 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
              required
            ></textarea>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all transform hover:scale-105"
            >
              {loading ? 'Submitting...' : 'Submit Testimonial'}
            </button>
          </form>
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