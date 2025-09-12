'use client';

import React, { useEffect, useMemo, useState } from 'react';

// Local inbuilt spreadsheet API
// GET  /api/inbuilt            -> { leads: LeadRecord[] }
// POST /api/inbuilt            -> { success: true, added: LeadRecord[] }
// PATCH /api/inbuilt           -> { success: true, updated: LeadRecord }

// External Flask API base for real-time search
// const API_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_API_BASE);

type TaskStatus = { done: boolean; timestamp?: string };

type LeadRecord = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  niche?: string;
  channels: string[]; // e.g., ['whatsapp','email','other:LinkedIn']
  tasks: Record<string, TaskStatus>;
  createdAt: string;
  updatedAt: string;
};

export default function DemoWizardPage() {
  // Wizard state
  const [step, setStep] = useState(1);
  const [niche, setNiche] = useState('');
  const [count, setCount] = useState<number>(5);
  const [channels, setChannels] = useState<string[]>(['whatsapp', 'email']);
  const [otherLabel, setOtherLabel] = useState('');
  const [preferences, setPreferences] = useState('');
  const [location, setLocation] = useState('');

  // Real-time run state
  // const [runId, setRunId] = useState<string | null>(null);
  // const [runStatus, setRunStatus] = useState<string | null>(null);
  // const [runLeads, setRunLeads] = useState<LeadRecord[]>([]);
  // const [runLogs, setRunLogs] = useState<string[]>([]);
  // const [elapsed, setElapsed] = useState<number>(0);
  // const [polling, setPolling] = useState<boolean>(false);

  // Remember last-used preferences
  useEffect(() => {
    try {
      const savedNiche = localStorage.getItem('demo_last_niche');
      const savedCount = localStorage.getItem('demo_last_count');
      const savedChannels = localStorage.getItem('demo_last_channels');
      const savedOther = localStorage.getItem('demo_last_other');
      const savedLocation = localStorage.getItem('demo_last_location');
      if (savedNiche) setNiche(savedNiche);
      if (savedCount) setCount(Number(savedCount));
      if (savedChannels) {
        const parsed = JSON.parse(savedChannels);
        if (Array.isArray(parsed) && parsed.length) setChannels(parsed);
      }
      if (savedOther) setOtherLabel(savedOther);
      if (savedLocation) setLocation(savedLocation);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('demo_last_niche', niche || '');
      localStorage.setItem('demo_last_count', String(count || 0));
      localStorage.setItem('demo_last_channels', JSON.stringify(channels));
      localStorage.setItem('demo_last_other', otherLabel || '');
      localStorage.setItem('demo_last_location', location || '');
    } catch {}
  }, [niche, count, channels, otherLabel, location]);

  // Result state
  const [records, setRecords] = useState<LeadRecord[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemoUser] = useState(true);

  useEffect(() => {
    if (isDemoUser) {
      setCount(1);
    }
  }, [isDemoUser]);

  const finalChannels = useMemo(() => {
    const base = new Set(channels);
    if (otherLabel.trim()) base.add(`other:${otherLabel.trim()}`);
    return Array.from(base);
  }, [channels, otherLabel]);

  function toggleChannel(ch: string) {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  }

  function waLink(phone?: string, text?: string) {
    if (!phone) return undefined;
    const digits = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(text || `Hi, let&apos;s talk about ${niche || 'your needs'}`);
    return `https://wa.me/${digits}?text=${msg}`;
  }

  function mailtoLink(email?: string, subject?: string, body?: string) {
    if (!email) return undefined;
    const s = encodeURIComponent(subject || `Regarding ${niche || 'Services'}`);
    const b = encodeURIComponent(body || 'Hello, following up from the demo.');
    return `mailto:${email}?subject=${s}&body=${b}`;
  }

  async function generateAndSaveLeads() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // Generate simple placeholder leads client-side (demo mode)
      const leads = Array.from({ length: Math.max(1, Math.min(50, Number(count) || 1)) }).map((_, i) => {
        const idx = i + 1;
        const nm = `${niche || 'General'} Lead #${idx}`;
        const company = `${niche || 'Acme'} Co ${idx}`;
        const email = `contact${idx}@example.com`;
        const phone = `+1555000${(100 + idx).toString()}`; // demo phone
        return { name: nm, company, email, phone, niche: niche || 'General', channels: finalChannels };
      });

      const res = await fetch('/api/inbuilt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save to inbuilt spreadsheet');
      
      if (isDemoUser) {
        setSuccess('Your lead has been generated and is being processed. The results will be available in the dashboard shortly.');
        setStep(5);
      } else {
        setRecords(data.added || []);
        setSuccess(`Added ${data.added?.length || 0} leads to inbuilt spreadsheet.`);
        setStep(5);
      }
    } catch (e) {
      setError((e as Error).message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  async function updateTask(id: string, task: string, done: boolean) {
    try {
      const res = await fetch('/api/inbuilt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, task, done }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to update task');
      setRecords((prev) => prev.map((r) => (r.id === id ? data.updated : r)));
    } catch (e) {
      setError((e as Error).message || 'Failed to update status');
    }
  }

  async function clearSpreadsheet() {
    setError(null);
    setSuccess(null);
    const ok = typeof window !== 'undefined' ? window.confirm('This will permanently clear the inbuilt spreadsheet. Continue?') : true;
    if (!ok) return;
    try {
      const res = await fetch('/api/inbuilt', { method: 'DELETE', headers: { 'x-confirm-clear': 'true' } });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to clear');
      setRecords([]);
      setSuccess('Inbuilt spreadsheet cleared.');
    } catch (e) {
      setError((e as Error).message || 'Failed to clear inbuilt spreadsheet');
    }
  }

  // Start realtime search via Flask backend
  /*
  async function startRealtimeSearch() {
    try {
      // const error = null;
      setSuccess(null);
      setLoading(true);
      setRunId(null);
      setRunStatus(null);
      setRunLeads([]);
      setRunLogs([]);
      setElapsed(0);

      // Only send supported channels to backend
      const supported = new Set(['whatsapp', 'email', 'phone']);
      const sendChannels = finalChannels
        .map((c) => (c.startsWith('other:') ? null : c))
        .filter((c): c is string => !!c)
        .filter((c) => supported.has(c));

      const res = await fetch(`${API_BASE}/start_realtime_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche,
          count,
          channels: sendChannels,
          preferences,
          location,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.run_id) throw new Error(data.error || 'Failed to start real-time search');
      setRunId(data.run_id);
      setPolling(true);
      setElapsed(0);
    } catch (e) {
        if (e instanceof Error) {
            setError(e.message || 'Failed to start task');
        }
    } finally {
      setLoading(false);
    }
  }
  */

  // Poll for status
  /*
  useEffect(() => {
    if (!runId || !polling) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/task_status/${runId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Polling failed');

        setRunStatus(data.status);
        setRunLeads(data.leads || []);
        setRunLogs(data.logs || []);
        setElapsed((prev) => prev + 2);

        if (data.status === 'completed' || data.status === 'failed') {
          setPolling(false);
        }
      } catch (e) {
        if (e instanceof Error) {
            setError(e.message || 'Failed to poll status');
        }
        setPolling(false);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [runId, polling]);
  */

  if (step === 1)
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step 1: What&apos;s your niche?</h2>
        <p className="text-sm text-slate-500">
          This helps us find the most relevant leads for your business.
        </p>
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g., &apos;SaaS startups in London&apos;"
          className="w-full rounded border border-slate-300 p-2"
        />
        <button
          onClick={() => setStep(2)}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          disabled={!niche.trim()}
        >
          Next
        </button>
      </div>
    );

  if (step === 2)
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step 2: How many leads do you need?</h2>
        <p className="text-sm text-slate-500">
          Specify the number of leads you want to generate. For demo users, this is limited to 1.
        </p>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min="1"
            max={isDemoUser ? 1 : 50}
            className="w-full rounded border border-slate-300 p-2"
            disabled={isDemoUser}
          />
        </div>
        <button
          onClick={() => setStep(3)}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    );

  if (step === 3)
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step 3: What outreach channels do you want to use?</h2>
        <p className="text-sm text-slate-500">
          We will attempt to find contact details for these channels.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={channels.includes('whatsapp')} onChange={() => toggleChannel('whatsapp')} />
            WhatsApp
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={channels.includes('email')} onChange={() => toggleChannel('email')} />
            Email
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={channels.includes('phone')} onChange={() => toggleChannel('phone')} />
            Phone
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={channels.some((c) => c.startsWith('other:'))}
              onChange={() => {
                const other = channels.find((c) => c.startsWith('other:'));
                if (other) setChannels(channels.filter((c) => !c.startsWith('other:')));
                else setChannels([...channels, 'other:']);
              }}
            />
            Other
          </label>
        </div>
        {channels.some((c) => c.startsWith('other:')) && (
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700">
              What&apos;s the other channel?
            </label>
            <input
              type="text"
              value={otherLabel}
              onChange={(e) => setOtherLabel(e.target.value)}
              placeholder="e.g., &apos;LinkedIn&apos;"
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </div>
        )}
        <button
          onClick={() => setStep(4)}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    );

  if (step === 4)
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step 4: Any other preferences?</h2>
        <p className="text-sm text-slate-500">
          You can specify target locations, technologies used, or other criteria to refine the search.
        </p>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="e.g., &apos;focus on companies using Stripe&apos;"
          className="w-full rounded border border-slate-300 p-2"
          rows={3}
        />
        <button
          onClick={generateAndSaveLeads}
          className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Leads'}
        </button>
      </div>
    );

  if (step === 5)
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your leads are ready!</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <p className="text-sm text-slate-500">
          Here are the leads we've generated for you. You can now reach out to them via their preferred channels.
        </p>
        <div className="pt-4">
          <button
            onClick={() => setStep(1)}
            className="rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-700"
          >
            Start Over
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Task: Contacted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Task: Followed Up
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{record.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-slate-500">{record.company}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {record.email && <div>{record.email}</div>}
                    {record.phone && <div>{record.phone}</div>}
                  </td>
                  <td className="flex space-x-2 whitespace-nowrap px-6 py-4 text-sm">
                    {record.channels.includes('whatsapp') && (
                      <a
                        href={waLink(record.phone) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        title="Open WhatsApp"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 8A10 10 0 0 0 8 18c0 1.4.3 2.8.8 4.1L3 24l2.1-5.9A10 10 0 1 0 18 8zM8 21.2a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                          <path d="m13.3 10.4-1.9-1.9a.5.5 0 0 0-.7 0l-.9.9a.5.5 0 0 0 0 .7l2.8 2.8a.5.5 0 0 0 .7 0l.9-.9a.5.5 0 0 0 0-.7z" />
                          <path d="m16.2 7.5-2.8-2.8a.5.5 0 0 0-.7 0l-.9.9a.5.5 0 0 0 0 .7l1.9 1.9" />
                        </svg>
                      </a>
                    )}
                    {record.channels.includes('email') && (
                      <a
                        href={mailtoLink(record.email) || '#'}
                        className="text-blue-600 hover:underline"
                        title="Send Email"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 5H2v14h20V5zm-2 2-8 5-8-5V7l8 5 8-5v2z" />
                        </svg>
                      </a>
                    )}
                    {record.channels.map((c: string) =>
                      c.startsWith('other:') ? (
                        <span key={c} className="text-sm text-slate-600" title={c.split(':')[1]}>
                          ...
                        </span>
                      ) : null,
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={record.tasks?.['contacted']?.done}
                        onChange={(e) => updateTask(record.id, 'contacted', e.target.checked)}
                      />
                      <label className="text-sm text-slate-900">Contacted</label>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={record.tasks?.['followed_up']?.done}
                        onChange={(e) => updateTask(record.id, 'followed_up', e.target.checked)}
                      />
                      <label className="text-sm text-slate-900">Followed Up</label>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {new Date(record.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <button
            onClick={clearSpreadsheet}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            disabled={!records.length}
          >
            Clear Demo Leads
          </button>
        </div>
      </div>
    );
}