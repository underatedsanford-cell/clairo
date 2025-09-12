'use client';

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md p-6 rounded-xl bg-white/5 border border-white/10">
        <h1 className="text-2xl font-semibold mb-4 text-white">Sign in</h1>
        <p className="text-sm text-gray-300 mb-6">Use the header buttons to sign in or sign up with Clerk.</p>
      </div>
    </div>
  );
}