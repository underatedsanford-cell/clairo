import { google, sheets_v4 } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sheetId = url.searchParams.get('sheetId');
    if (!sheetId) {
      return NextResponse.json({ error: 'Missing sheetId query parameter' }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve the user's Google OAuth access token via Clerk
    const clerk = await clerkClient();
    const tokens: unknown = await clerk.users.getUserOauthAccessToken(userId, 'oauth_google');
    const token = Array.isArray(tokens) ? (tokens[0] as { token: string })?.token : (tokens as { data: { token: string }[] })?.data?.[0]?.token;

    if (!token) {
      return NextResponse.json({ error: 'No Google OAuth access token found for this user. Please connect your Google account.' }, { status: 403 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const sheets: sheets_v4.Sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Leads!A:Z',
    });

    const rows = response.data.values;
    if (rows) {
      return NextResponse.json(rows);
    }
    return NextResponse.json({ message: 'No data found' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching Google Sheet data with Clerk OAuth token:', message);
    return NextResponse.json({ error: 'Failed to fetch data', details: message }, { status: 500 });
  }
}