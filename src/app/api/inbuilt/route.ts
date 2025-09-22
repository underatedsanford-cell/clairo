import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Types (for clarity only)
interface LeadInput {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  niche?: string;
  channels?: string[]; // ["whatsapp","email","other:<label>"]
}

interface TaskStatus {
  done: boolean;
  timestamp?: string;
}

interface LeadRecord {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  niche?: string;
  channels: string[];
  tasks: Record<string, TaskStatus>; // e.g., whatsapp, email, other:custom
  createdAt: string;
  updatedAt: string;
}

interface DBShape {
  leads: LeadRecord[];
}

function getDbPath() {
  const cacheDir = path.resolve(process.cwd(), '.next', 'cache');
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not ensure cache directory:', e);
  }
  return path.resolve(cacheDir, 'inbuilt_spreadsheet.json');
}

function readDb(): DBShape {
  const p = getDbPath();
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.leads)) {
        return { leads: data.leads };
      }
    }
  } catch (e) {
    console.warn('Failed to read inbuilt spreadsheet:', e);
  }
  return { leads: [] };
}

function writeDb(db: DBShape) {
  const p = getDbPath();
  try {
    fs.writeFileSync(p, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write inbuilt spreadsheet:', e);
  }
}

export async function GET() {
  const db = readDb();
  return NextResponse.json({ leads: db.leads }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leads: LeadInput[] = Array.isArray(body?.leads) ? body.leads : [];
    if (!leads.length) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 });
    }
    const db = readDb();
    const now = new Date().toISOString();

    const toAdd: LeadRecord[] = leads.map((l: LeadInput) => {
      const id = (globalThis.crypto?.randomUUID?.() || randomUUID());
      const channels = Array.isArray(l.channels) && l.channels.length ? l.channels : ['whatsapp', 'email'];
      const tasks: Record<string, TaskStatus> = {};
      for (const ch of channels) {
        tasks[ch] = { done: false };
      }
      return {
        id,
        name: String(l.name || 'Lead'),
        company: l.company ? String(l.company) : undefined,
        email: l.email ? String(l.email) : undefined,
        phone: l.phone ? String(l.phone) : undefined,
        niche: l.niche ? String(l.niche) : undefined,
        channels,
        tasks,
        createdAt: now,
        updatedAt: now,
      };
    });

    db.leads.push(...toAdd);
    writeDb(db);
    return NextResponse.json({ success: true, added: toAdd }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to add leads';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id: string = body?.id;
    const task: string = body?.task; // e.g., 'whatsapp', 'email', or 'other:LinkedIn'
    const done: boolean = Boolean(body?.done);
    if (!id || !task) {
      return NextResponse.json({ error: 'Missing id or task' }, { status: 400 });
    }

    const db = readDb();
    const idx = db.leads.findIndex(l => l.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = db.leads[idx];
    if (!lead.tasks[task]) {
      // initialize if not present
      lead.tasks[task] = { done: false };
      if (!lead.channels.includes(task)) lead.channels.push(task);
    }
    lead.tasks[task].done = done;
    lead.tasks[task].timestamp = done ? new Date().toISOString() : undefined;
    lead.updatedAt = new Date().toISOString();

    db.leads[idx] = lead;
    writeDb(db);
    return NextResponse.json({ success: true, updated: lead }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to update task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const confirm = req.headers.get('x-confirm-clear');
    if (confirm !== 'true') {
      return NextResponse.json({ error: 'Missing confirmation header' }, { status: 400 });
    }
    // Clear all leads safely
    writeDb({ leads: [] });
    return NextResponse.json({ success: true, cleared: true }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to clear inbuilt spreadsheet';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}