'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';

type Lead = {
  id: string;
  name: string;
  company: string;
  status: string;
  lastContacted: string;
};

type CRMSystemProps = {
  leads: Lead[];
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
};

export default function CRMSystem({ leads }: CRMSystemProps) {
  const [filter, setFilter] = useState('');

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(filter.toLowerCase()) ||
      lead.company.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-300">Lead Management</h2>
        <input
          type="text"
          placeholder="Search leads..."
          className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Contacted</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {filteredLeads.map((lead, i) => (
              <motion.tr
                key={lead.id}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                custom={i}
                className="hover:bg-gray-800/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{lead.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{lead.company}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${{
                      'New': 'bg-blue-900 text-blue-200',
                      'Contacted': 'bg-yellow-900 text-yellow-200',
                      'Qualified': 'bg-green-900 text-green-200',
                      'Lost': 'bg-red-900 text-red-200',
                    }[lead.status] || 'bg-gray-700 text-gray-200'}`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{lead.lastContacted}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}