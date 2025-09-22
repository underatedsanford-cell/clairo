'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

type TaskRun = {
  id: string;
  command: string;
  user_id: string;
  parameters: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";
const API_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_API_BASE);

export default function TaskRunsPage() {
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const fetchRuns = async () => {
    if (!API_CONFIGURED) {
      setLoading(false);
      setError("External bot backend not configured. Set NEXT_PUBLIC_API_BASE or run it at http://localhost:5001.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/task-runs`);
      if (!res.ok) throw new Error(`Failed to load: ${res.status}. Is the backend running at ${API_BASE}?`);
      const data = await res.json();
      setRuns(data.task_runs || []);
    } catch (e) {
      setError((e as Error).message || "Failed to load task runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  async function createTestRun() {
    if (!API_CONFIGURED) {
      setError("External bot backend not configured. Set NEXT_PUBLIC_API_BASE or run it at http://localhost:5001.");
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/task-runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "ui_test",
          user_id: "website",
          parameters: { source: "task-runs-page" },
          log: "Created from Website UI",
        }),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const data = await res.json();
      const newId = data?.task_run?.id || data?.run_id;
      // refresh list in background
      fetchRuns();
      if (newId) {
        router.push(`/task-runs/${newId}`);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to create task run");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center space-x-2 mb-8">
          <Image src="/clairo_logo.svg" alt="Dyna Logo" width={32} height={32} className="w-8 h-8" />
          <span className="text-lg font-bold">Dyna</span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold mb-2">Task Runs</h1>
            <p className="text-gray-400">Live tracking for your Discord-triggered automations.</p>
          </div>
          <button
            onClick={createTestRun}
            disabled={creating || !API_CONFIGURED}
            className={`inline-flex items-center px-4 py-2 rounded-lg border transition-colors ${
              creating || !API_CONFIGURED
                ? "bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-purple-600/20 border-purple-500/50 text-purple-200 hover:bg-purple-600/30 hover:border-purple-400"
            }`}
          >
            {creating ? "Creating..." : "Create Test Task Run"}
          </button>
        </div>

        {!API_CONFIGURED && (
          <div className="text-yellow-300 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
            External bot backend not configured. Set NEXT_PUBLIC_API_BASE to your bot API base URL or start the backend at http://localhost:5001.
          </div>
        )}

        {loading && <div className="text-gray-300">Loading task runs...</div>}
        {error && (
          <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runs.length === 0 && (
              <div className="text-gray-400">No task runs yet.</div>
            )}
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/task-runs/${run.id}`}
                className="block p-5 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{new Date(run.created_at).toLocaleString()}</span>
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
                <h3 className="text-xl font-semibold mb-1">{run.command}</h3>
                <p className="text-sm text-gray-400">ID: {run.id}</p>
                <div className="mt-3 text-sm text-gray-300">
                  Params: {Object.keys(run.parameters || {}).length > 0 ? (
                    <span className="text-gray-400">{Object.keys(run.parameters).length} keys</span>
                  ) : (
                    <span className="text-gray-500">none</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}