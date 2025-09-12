'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string | undefined;

export default function Footer() {
  const [health, setHealth] = useState<'unknown' | 'ok' | 'down'>('unknown');

  useEffect(() => {
    let mounted = true;
    let inflight = false;

    if (!API_BASE) {
      // No backend configured; skip polling and show Unknown
      return () => {
        mounted = false;
      };
    }

    async function fetchHealth() {
      if (inflight) return;
      inflight = true;
      try {
        const res = await fetch(api.healthCheck(), { cache: 'no-store' });
        const text = await res.text();
        console.log('Health check response:', text);
        const data = JSON.parse(text);
        if (!mounted) return;
        const next: 'ok' | 'down' = data?.ok ? 'ok' : 'down';
        setHealth(prev => (prev === next ? prev : next));
      } catch (error) {
        console.error('Failed to parse health check response:', error);
        if (!mounted) return;
        setHealth(prev => (prev === 'down' ? prev : 'down'));
      } finally {
        inflight = false;
      }
    }

    fetchHealth();
    const id = setInterval(fetchHealth, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const dotClass = health === 'ok' ? 'bg-green-500' : health === 'down' ? 'bg-red-500' : 'bg-gray-400';
  const label = health === 'ok' ? 'OK' : health === 'down' ? 'Unhealthy' : 'Unknown';

  return (
    <footer className="py-12 bg-gray-950 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Image src="/clairo_logo.svg" alt="Clairo Logo" width={32} height={32} />
              <span className="ml-3 text-xl font-bold">Clairo</span>
            </div>
            <p className="text-gray-400">
              Transforming businesses with AI-powered sales automation.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a 
                  href="https://wa.me/0738101905" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp: 0738101905
                </a>
              </li>
              <li>
                <a 
                  href="mailto:underatedsanford@gmail.com" 
                  className="hover:text-white transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  underatedsanford@gmail.com
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/support" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><a href="mailto:support@clairo.com" className="hover:text-white transition-colors">Email Support</a></li>
              <li><a href="tel:+15551234567" className="hover:text-white transition-colors">Call Sales</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex items-center justify-center gap-4 text-center">
          <p className="text-gray-400">
            &copy; 2024 Clairo. All rights reserved.
          </p>
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
            <span className={`w-2 h-2 rounded-full mr-2 ${dotClass}`} />
            Bot: {label}
          </span>
        </div>
      </div>
    </footer>
  );
}