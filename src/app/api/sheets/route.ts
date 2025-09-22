import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getLocalLeadsPath() {
  return path.resolve(process.cwd(), 'lead.json');
}

function readLocalLeadsRows(): string[][] | null {
  try {
    const p = getLocalLeadsPath();
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data || !Array.isArray(data)) return null;
    const header = ['Timestamp', 'Name', 'Email', 'Company', 'Message'];
    const rows = data.map((item: Record<string, string>) => [
      String(item.timestamp || ''),
      String(item.name || ''),
      String(item.email || ''),
      String(item.company || ''),
      String(item.message || ''),
    ]);
    return [header, ...rows];
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const rows = readLocalLeadsRows();
  if (rows) {
    return NextResponse.json(rows);
  }
  return NextResponse.json({ error: 'Could not read leads' }, { status: 500 });
}