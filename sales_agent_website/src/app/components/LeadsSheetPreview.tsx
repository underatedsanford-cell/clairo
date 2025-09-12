import { api } from "../lib/api";

async function getSheetData() {
  try {
    const res = await fetch(api.submitLead(), { next: { revalidate: 5 } });
    if (!res.ok) {
      return { error: `Failed to load sheet: ${res.status}` };
    }
    const data: string[][] = await res.json();
    return { rows: data };
  } catch (e) {
    return { error: (e as Error).message || "Network error" };
  }
}

export default async function LeadsSheetPreview() {
  const { rows, error } = await getSheetData();

  return (
    <section className="py-16 px-4 bg-gray-900/40 border-t border-gray-800">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          Leads Sheet Preview
        </h2>
        {error ? (
          <div className="rounded-lg border border-red-700 bg-red-900/30 p-4 text-red-200">
            <p className="font-semibold">Couldn't load data</p>
            <p className="text-sm opacity-80 mt-1">There was an error fetching the leads data.</p>
          </div>
        ) : rows && rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-gray-800/60">
                <tr>
                  {(rows[0] || []).map((h, idx) => (
                    <th key={idx} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{String(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1, 6).map((r, rIdx) => (
                  <tr key={rIdx} className="odd:bg-gray-900/20 even:bg-gray-900/40">
                    {(r || []).map((c, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 whitespace-nowrap">{String(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 6 && (
              <div className="text-xs text-gray-400 p-3">Showing first 5 rows. Data provided by /api/sheets.</div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4 text-gray-300">
            No data returned from the sheet.
          </div>
        )}
      </div>
    </section>
  );
}