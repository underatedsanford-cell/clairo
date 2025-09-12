"use client";

import React, { useEffect, useState, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";
const API_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_API_BASE);

type BotStatus = {
  running: boolean;
  pid?: number;
  message?: string;
  lastStart?: string;
  details?: unknown;
};

type BotHealth = {
  success: boolean;
  ok: boolean;
  running: boolean;
  pid?: number;
  lastStart?: string;
};

export default function StartBotPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [health, setHealth] = useState<"unknown" | "ok" | "down">("unknown");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  function formatLastStart(ts?: string) {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    if (sec < 30) return "just now";
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
    if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  }

  // Generic fetch with retry/backoff
  async function requestWithRetry(input: RequestInfo | URL, init?: RequestInit, opts?: { retries?: number; baseDelayMs?: number; maxDelayMs?: number }) {
    const retries = opts?.retries ?? 3;
    const baseDelay = opts?.baseDelayMs ?? 500;
    const maxDelay = opts?.maxDelayMs ?? 3000;

    let attempt = 0;
    let lastErr: unknown = null;
    while (attempt <= retries) {
      try {
        const res = await fetch(input, init);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
        }
        return res;
      } catch (e) {
        lastErr = e;
        if (attempt === retries) break;
        const jitter = Math.random() * 100;
        const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt)) + jitter;
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
      }
    }
    throw lastErr || new Error("Request failed");
  }

  const fetchStatus = async () => {
    if (!API_CONFIGURED) return; // Avoid network calls when backend not configured
    try {
      const res = await fetch(`${API_BASE}/api/bot/status`, { cache: "no-store" });
      const data = await res.json();
      setStatus(data);
      if (data?.running) {
        // Trigger a health check when running
        void checkHealth();
      } else {
        setHealth("unknown");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch bot status");
    }
  };

  const checkHealth = async () => {
    if (!API_CONFIGURED) {
      setHealth("unknown");
      return;
    }
    if (!status?.running) {
      setHealth("unknown");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/bot/health`, { cache: "no-store" });
      const data: BotHealth = await res.json();
      setHealth(data?.ok ? "ok" : "down");
      // When updating status after status fetch, avoid unnecessary updates
      if (data?.lastStart && status) {
        setStatus({ ...status, lastStart: data.lastStart });
      }
    } catch {
      setHealth("down");
    }
  };

  const startBot = async () => {
    if (!API_CONFIGURED) {
      setError("Backend API not configured. Set NEXT_PUBLIC_API_BASE or run the backend at http://localhost:5001.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await requestWithRetry(`${API_BASE}/api/bot/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setSuccess(data.message || "Bot start initiated");
      // Refresh status after a short delay to allow process to spawn
      setTimeout(fetchStatus, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start bot");
    } finally {
      setLoading(false);
    }
  };

  const stopBot = async () => {
    if (!API_CONFIGURED) {
      setError("Backend API not configured. Set NEXT_PUBLIC_API_BASE or run the backend at http://localhost:5001.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await requestWithRetry(`${API_BASE}/api/bot/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setSuccess(data.message || "Bot stop initiated");
      setTimeout(fetchStatus, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop bot");
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear banners after 3 seconds
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  // Live polling
  useEffect(() => {
    if (!API_CONFIGURED) return; // Do not poll when backend not configured
    void fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Manage Bot</h1>
      <p className="text-gray-600 mb-6">
        Use this page to start/stop the Discord bot and view its health.
      </p>

      {!API_CONFIGURED && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded mb-4">
          External bot backend not configured. Set NEXT_PUBLIC_API_BASE to your bot API base URL or start the backend at http://localhost:5001.
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-xl font-semibold mb-2">Current Status</h2>
        {status ? (
          <div className="space-y-1">
            <div>
              <span className="font-medium">Running:</span>
              <span className={`ml-2 ${status.running ? "text-green-600" : "text-red-600"}`}>
                {status.running ? "Yes" : "No"}
              </span>
            </div>
            {typeof status.pid !== "undefined" && (
              <div>
                <span className="font-medium">PID:</span>
                <span className="ml-2">{status.pid}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Health:</span>
              <span
                className={`ml-2 ${
                  health === "ok"
                    ? "text-green-600"
                    : health === "down"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {health === "ok" ? "OK" : health === "down" ? "Unhealthy" : "Unknown"}
              </span>
              {status?.running && (
                <button onClick={checkHealth} className="ml-3 text-sm text-blue-600 hover:underline">
                  Recheck
                </button>
              )}
            </div>
            {status.lastStart && (
              <div className="flex items-center text-sm text-gray-400 mt-1">
                <span>Last started:</span>
                <span className="ml-2" title={status.lastStart}>{formatLastStart(status.lastStart)}</span>
              </div>
            )}
            {status.message && <div className="text-gray-500">{status.message}</div>}
          </div>
        ) : (
          <div className="text-gray-500">Loading status...</div>
        )}
        <div className="mt-3">
          <button onClick={fetchStatus} className="text-sm text-blue-600 hover:underline">
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4">{success}</div>}

      <div className="flex items-center gap-3">
        <button
          onClick={startBot}
          disabled={loading || !!status?.running || !API_CONFIGURED}
          className={`px-4 py-2 rounded text-white ${
            loading || status?.running || !API_CONFIGURED ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Processing..." : "Start Bot"}
        </button>
        <button
          onClick={stopBot}
          disabled={loading || !status?.running || !API_CONFIGURED}
          className={`px-4 py-2 rounded text-white ${
            loading || !status?.running || !API_CONFIGURED ? "bg-gray-400" : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {loading ? "Processing..." : "Stop Bot"}
        </button>
        <button onClick={fetchStatus} disabled={!API_CONFIGURED} className={`px-4 py-2 rounded border ${!API_CONFIGURED ? "border-gray-200 text-gray-300" : "border-gray-300 hover:bg-gray-50"}`}>
          Check Status
        </button>
      </div>
    </div>
  );
}