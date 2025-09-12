"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function CallsView() {
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();

  // Generate or read a stable room name on client only to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
    const existing = params.get("room");
    if (existing && existing.trim() !== "") {
      setRoomName(existing.trim());
      return;
    }
    const generated = `salesagent-${Math.random().toString(36).slice(2, 10)}`;
    setRoomName(generated);
    // Update URL with the room param (no scroll) to make it shareable
    const url = new URL(window.location.href);
    url.searchParams.set("room", generated);
    router.replace(`${url.pathname}${url.search}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jitsiUrl = useMemo(() => {
    if (!roomName) return "";
    return `https://meet.jit.si/${roomName}#config.prejoinConfig.enabled=false`;
  }, [roomName]);

  return (
    <div className="min-h-[70vh] w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Voice & Video Calls</h1>
        <p className="text-muted-foreground mb-8">
          Start an embedded Jitsi meeting right here, or use a WhatsApp deep link to continue the conversation.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Jitsi Meeting Card */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Jitsi Meeting (Embedded)</h2>
              {!meetingStarted ? (
                <button
                  onClick={() => setMeetingStarted(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition"
                >
                  Start Meeting
                </button>
              ) : (
                <button
                  onClick={() => setMeetingStarted(false)}
                  className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-destructive-foreground hover:opacity-90 transition"
                >
                  End Meeting
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Room: <span className="font-mono">{hasMounted && roomName ? roomName : "—"}</span>
            </p>
            <div className="rounded-lg overflow-hidden border bg-black">
              {hasMounted && meetingStarted && roomName ? (
                <iframe
                  title="Jitsi Meeting"
                  src={jitsiUrl}
                  className="w-full h-[420px]"
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex items-center justify-center h-[220px] sm:h-[320px] text-sm text-muted-foreground">
                  Click "Start Meeting" to launch Jitsi in-page.
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Powered by Jitsi Meet. For a dedicated room name, share this page URL with teammates.
            </div>
          </div>

          {/* WhatsApp Card */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-5">
            <h2 className="text-xl font-semibold mb-3">WhatsApp (Deep Link)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              WhatsApp voice/video opens in the WhatsApp app or web client. Use a deep link to start the conversation.
            </p>
            <WhatsappDeepLink />
            <div className="mt-4 text-xs text-muted-foreground">
              Note: WhatsApp cannot be fully embedded due to platform restrictions, but the deep link keeps the flow streamlined.
            </div>
          </div>
        </div>

        <div className="mt-10 text-sm text-muted-foreground">
          Looking for more call options? We can integrate other providers upon request.
          {" "}
          <Link href="/support" className="text-primary underline underline-offset-4">Contact us</Link>.
        </div>
      </div>
    </div>
  );
}


export default function CallsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallsView />
        </Suspense>
    )
}

function WhatsappDeepLink() {
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("Hi! I'd like to talk about the sales agent demo.");

  const link = useMemo(() => {
    const p = phone.replace(/\D/g, "");
    const t = encodeURIComponent(text);
    // wa.me link: phone must be in international format without '+'
    return p ? `https://wa.me/${p}?text=${t}` : `https://wa.me/?text=${t}`;
  }, [phone, text]);

  return (
    <div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Phone (international format)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="15551234567"
            className="w-full rounded-md border px-3 py-2 bg-background"
            inputMode="tel"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prefilled message</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-md border px-3 py-2 bg-background"
          />
        </div>
      </div>
      <div className="mt-4">
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white hover:opacity-90 transition"
        >
          Open WhatsApp
        </a>
      </div>
    </div>
  );
}