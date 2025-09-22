const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export const api = {
  healthCheck: () => `${API_BASE}/api/health`,
  submitLead: () => `/api/sheets`,
  status: () => `${API_BASE}/api/status`,
};