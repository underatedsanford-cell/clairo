import Link from 'next/link';
import { getCommand } from '../data';

export default function CommandDetailPage({ params }) {
  const meta = getCommand(params.slug);
  if (!meta) {
    return (
      <main className="min-h-screen text-white px-4 py-12">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4">Not Found</h1>
          <p className="text-gray-300 mb-6">No feature found for “{params.slug}”.</p>
          <Link href="/commands" className="text-purple-300 hover:underline">Back to features</Link>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen text-white px-4 py-12">
      <div className="container mx-auto max-w-3xl">
        <Link href="/commands" className="text-purple-300 hover:underline">← All features</Link>
        <h1 className="text-5xl font-bold mt-4 mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          {meta.title}
        </h1>
        <p className="text-gray-300 mb-8">{meta.shortDescription || meta.description}</p>

        <div className="space-y-4">
          {/* Long description */}
          {meta.longDescription && (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-purple-200 mb-2">Overview</h2>
              <p className="text-gray-300 text-sm">{meta.longDescription}</p>
            </div>
          )}

          {/* Example */}
          {meta.example && (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-purple-200 mb-2">Example</h2>
              <p className="text-gray-300 text-sm italic">{meta.example}</p>
            </div>
          )}

          {/* Steps */}
          {meta.steps && meta.steps.length > 0 && (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-purple-200 mb-3">How to use</h2>
              <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                {meta.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Website path / Related page */}
          {meta.websitePath && (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-purple-200 mb-2">Related Page</h2>
              <Link href={meta.websitePath} className="text-purple-300 hover:underline">{meta.websitePath}</Link>
            </div>
          )}

          {/* Permissions and tags */}
          {(meta.permissions?.length || meta.tags?.length) && (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-purple-200 mb-2">Requirements & Tags</h2>
              {meta.permissions?.length ? (
                <div className="mb-3">
                  <div className="text-sm text-gray-400 mb-1">Permissions</div>
                  <div className="flex flex-wrap gap-2">
                    {meta.permissions.map(p => (
                      <span key={p} className="px-2 py-1 bg-gray-700/60 rounded text-xs text-gray-200">{p}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {meta.tags?.length ? (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {meta.tags.map(t => (
                      <span key={t} className="px-2 py-1 bg-gray-700/60 rounded text-xs text-gray-200">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* CTA */}
          {meta.ctaText && (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-purple-200 mb-1">Ready to try it?</h2>
                <p className="text-gray-400 text-sm">Jump into the relevant flow and see it in action.</p>
              </div>
              <Link href={meta.ctaLink || meta.websitePath || '/demo'} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                {meta.ctaText}
              </Link>
            </div>
          )}

          {/* Screenshots */}
          {meta.screenshots && meta.screenshots.length > 0 && (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-purple-200 mb-3">Screenshots</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {meta.screenshots.map((src, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-700 overflow-hidden bg-gray-900/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Screenshot ${idx + 1}`} className="w-full h-48 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API & Automation */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-purple-200 mb-2">API & Automation</h2>
            <p className="text-gray-300 text-sm">Most features also have API endpoints or background tasks. Visit the support section to learn how to integrate or automate them.</p>
          </div>
        </div>
      </div>
    </main>
  );
}