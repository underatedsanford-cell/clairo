'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";
const API_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_API_BASE);

type LogItem = { timestamp: string; message: string };

type TaskRun = {
  id: string;
  command: string;
  user_id: string;
  parameters: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  results?: Record<string, unknown>;
  logs?: LogItem[];
  approval_required?: boolean;
  approved?: boolean;
  error?: string | null;
};

export default function TaskRunDetailPage() {
  const params = useParams();
  const runId = params?.runId as string;
  const [run, setRun] = useState<TaskRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function loadRun() {
    if (!API_CONFIGURED) {
      setLoading(false);
      setError("External bot backend not configured. Set NEXT_PUBLIC_API_BASE or run it at http://localhost:5001.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/task-runs/${runId}`);
      if (!res.ok) throw new Error(`Failed to load: ${res.status}. Is the backend running at ${API_BASE}?`);
      const data = await res.json();
      setRun(data.task_run);
    } catch (e) {
      setError((e as Error).message || "Failed to load task run");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  useEffect(() => {
    if (!API_CONFIGURED) return; // Guard auto refresh when not configured
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadRun();
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, runId]);

  async function approveRun() {
    if (!API_CONFIGURED) {
      setError("External bot backend not configured. Set NEXT_PUBLIC_API_BASE or run it at http://localhost:5001.");
      return;
    }
    if (!runId) return;
    try {
      setApproving(true);
      const res = await fetch(`${API_BASE}/api/approve-task/${runId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Failed to approve: ${res.status}`);
      await loadRun();
    } catch (e) {
      setError((e as Error).message || "Failed to approve");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center space-x-2 mb-6">
          <Image src="/clairo_logo.svg" alt="Dyna Logo" width={32} height={32} className="w-8 h-8" />
          <span className="text-lg font-bold">Dyna</span>
        </div>

        {!API_CONFIGURED && (
          <div className="text-yellow-300 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
            External bot backend not configured. Set NEXT_PUBLIC_API_BASE to your bot API base URL or start the backend at http://localhost:5001.
          </div>
        )}

        <div className="flex items-start justify-between gap-4 mb-6 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold mb-1">Task Run Details</h1>
            {run && (
              <p className="text-sm text-gray-400">ID: {run.id} • Status: <span className="uppercase">{run.status}</span> • Logs: {run.logs ? run.logs.length : 0}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadRun()}
              className="px-3 py-2 rounded-lg border bg-gray-900 border-gray-700 hover:border-purple-500 hover:bg-purple-600/10 transition-colors"
            >
              Refresh
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          </div>
        </div>

        {loading && <div className="text-gray-300">Loading run...</div>}
        {error && (
          <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {run && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">{run.command}</h1>
                <span
                  className={`px-2 py-1 text-xs rounded-full border ${
                    run.status === "completed"
                      ? "bg-green-900/30 border-green-700 text-green-300"
                      : run.status === "running"
                      ? "bg-blue-900/30 border-blue-700 text-blue-300"
                      : run.status === "pending"
                      ? "bg-yellow-900/30 border-yellow-700 text-yellow-300"
                      : run.status === "approved"
                      ? "bg-emerald-900/30 border-emerald-700 text-emerald-300"
                      : "bg-gray-800 border-gray-700 text-gray-300"
                  }`}
                >
                  {run.status}
                </span>
              </div>
              <p className="text-sm text-gray-400">Run ID: {run.id}</p>
              <p className="text-sm text-gray-400">Started: {new Date(run.created_at).toLocaleString()}</p>
              <p className="text-sm text-gray-400">Updated: {new Date(run.updated_at).toLocaleString()}</p>

              {run.approval_required && !run.approved && (
                <div className="mt-4">
                  <button
                    disabled={approving}
                    onClick={approveRun}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg"
                  >
                    {approving ? "Approving..." : "Approve Action"}
                  </button>
                </div>
              )}
            </div>

            {run.parameters && Object.keys(run.parameters).length > 0 && (
              <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                <h2 className="text-xl font-semibold mb-3">Parameters</h2>
                <pre className="text-sm text-gray-200 whitespace-pre-wrap">{JSON.stringify(run.parameters, null, 2)}</pre>
              </div>
            )}

            {run.results && Object.keys(run.results).length > 0 && (
              <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                <h2 className="text-xl font-semibold mb-3">Results</h2>
                <pre className="text-sm text-gray-200 whitespace-pre-wrap">{JSON.stringify(run.results, null, 2)}</pre>
              </div>
            )}

            <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
              <h2 className="text-xl font-semibold mb-3">Logs</h2>
              <div className="space-y-2 max-h-80 overflow-auto pr-2">
                {(run.logs || []).length === 0 && (
                  <div className="text-gray-500">No logs yet.</div>
                )}
                {(run.logs || []).map((log, idx) => (
                  <div key={idx} className="text-sm text-gray-300">
                    <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}