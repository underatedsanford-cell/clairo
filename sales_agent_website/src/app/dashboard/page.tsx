"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import PipelineView from '../components/PipelineView';
import CRMSystem from '../components/CRMSystem';
import { api } from "../lib/api";

type BookedCall = {
  id: string;
  name: string;
  time: string;
};

type PipelineStage = {
    name: string;
    count: number;
    value: number;
};

type Lead = {
    id: string;
    name: string;
    company: string;
    status: string;
    lastContacted: string;
};

type SalesAgentStatus = {
  last_update: string;
  new_leads_added: number;
  outreach_sent_count: number;
  replies_received_count: number;
  calls_booked_count: number;
  deals_closed_count: number;
  total_pipeline_value: number;
  follow_ups_scheduled_count: number;
  booked_calls_list: BookedCall[];
};

type StatusData = {
  task_runs: Record<string, unknown>;
  sales_agent_status: SalesAgentStatus;
  pipeline_stages: PipelineStage[];
  leads: Lead[];
};

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(api.status(), { next: { revalidate: 5 } });
        if (!res.ok) throw new Error(`Failed to load: ${res.status}. Is the backend running?`);
        const data = await res.json();
        if (data.success) {
          // Add dummy data for now
          data.data.pipeline_stages = [
            { name: 'New Leads', count: 120, value: 240000 },
            { name: 'Contacted', count: 80, value: 160000 },
            { name: 'Qualified', count: 45, value: 90000 },
            { name: 'Closed Won', count: 15, value: 30000 },
          ];
          data.data.leads = [
            { id: '1', name: 'John Doe', company: 'Acme Inc.', status: 'Qualified', lastContacted: '2024-07-28' },
            { id: '2', name: 'Jane Smith', company: 'Stark Industries', status: 'Contacted', lastContacted: '2024-07-27' },
            { id: '3', name: 'Peter Jones', company: 'Wayne Enterprises', status: 'New', lastContacted: '2024-07-29' },
            { id: '4', name: 'Susan Williams', company: 'Cyberdyne Systems', status: 'Lost', lastContacted: '2024-07-25' },
          ];
          setStatus(data.data);
        }
      } catch (e) {
        if (e instanceof Error) {
          console.error(e.message || "Failed to load status");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center space-x-2 mb-8">
          <Image src="/clairo_logo.svg" alt="Dyna Logo" width={32} height={32} className="w-8 h-8" />
          <span className="text-lg font-bold">Dyna</span>
        </div>

        <h1 className="text-3xl font-bold mb-6">Sales Agent Dashboard</h1>

        {loading && (
          <div className="text-gray-300">Loading...</div>
        )}

        {!loading && !status && (
          <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            Failed to load status. Is the backend running?
          </div>
        )}

        {status && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-purple-300 mb-4">Current Status</h2>
                <p className="text-gray-300">{status.sales_agent_status.last_update}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-purple-300 mb-4">Key Metrics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400">New Leads</p>
                    <p className="text-2xl font-bold">{status.sales_agent_status.new_leads_added}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Outreach Sent</p>
                    <p className="text-2xl font-bold">{status.sales_agent_status.outreach_sent_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Replies Received</p>
                    <p className="text-2xl font-bold">{status.sales_agent_status.replies_received_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Calls Booked</p>
                    <p className="text-2xl font-bold">{status.sales_agent_status.calls_booked_count}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl md:col-span-2 lg:col-span-1">
                  <h2 className="text-xl font-semibold text-purple-300 mb-4">Pipeline</h2>
                  <div className="space-y-2">
                      <div>
                          <p className="text-gray-400">Deals Closed</p>
                          <p className="text-2xl font-bold">{status.sales_agent_status.deals_closed_count}</p>
                      </div>
                      <div>
                          <p className="text-gray-400">Total Pipeline Value</p>
                          <p className="text-2xl font-bold">${status.sales_agent_status.total_pipeline_value}</p>
                      </div>
                       <div>
                          <p className="text-gray-400">Follow-ups Scheduled</p>
                          <p className="text-2xl font-bold">{status.sales_agent_status.follow_ups_scheduled_count}</p>
                      </div>
                  </div>
              </div>
            </div>
            <div className="mt-6">
              <PipelineView stages={status.pipeline_stages} />
            </div>
            <div>
              <CRMSystem leads={status.leads} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}