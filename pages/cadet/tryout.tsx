import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import Link from "next/link";

let socket: any = null;

export default function Tryout() {
  const [status, setStatus] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const tickRef = useRef<any>(null);
  const saveRef = useRef<any>(null);

  async function refresh() {
    const r = await fetch("/api/cadet/status");
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(data.error || "Blocked");
      setStatus(null);
      return;
    }
    setStatus(data);
    setMsg(null);
  }

  useEffect(() => {
    refresh();
    tickRef.current = setInterval(refresh, 5000);
    return () => clearInterval(tickRef.current);
  }, []);

  // Load notes from server once tryout is ACTIVE
  useEffect(() => {
    if (!status?.team?.id) return;
    if (status.state !== "ACTIVE") return;

    (async () => {
      try {
        const r = await fetch("/api/cadet/notes");
        const data = await r.json();
        if (r.ok) setNotes(data.content || "");
      } catch {}
    })();
  }, [status?.team?.id, status?.state]);

  // socket sync
  useEffect(() => {
    if (!status?.team?.id) return;

    if (!socket) socket = io({ path: "/socket.io" });

    socket.emit("team:join", { teamId: status.team.id });
    socket.on("notes:sync", (payload: any) => setNotes(payload?.content || ""));

    return () => {
      socket.off("notes:sync");
    };
  }, [status?.team?.id]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    const endsAt = status?.session?.endsAt ? new Date(status.session.endsAt).getTime() : null;
    if (!endsAt) return null;
    const ms = Math.max(0, endsAt - now);
    const s = Math.floor(ms / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [status?.session?.endsAt, now]);

  async function start() {
    setMsg(null);

    try {
      const r = await fetch("/api/cadet/start", { method: "POST" });

      // IMPORTANT: read raw first so we can detect "Next.js chunk" responses
      const raw = await r.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch { data = { raw: raw.slice(0, 250) }; }

      if (!r.ok) {
        setMsg(`START FAILED ${r.status}: ` + (data?.error || JSON.stringify(data)));
        return;
      }

      await refresh();
    } catch (e: any) {
      setMsg("Start crashed: " + String(e?.message || e));
    }
  }

  // Debounced save to DB
  function updateNotes(next: string) {
    setNotes(next);
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      fetch("/api/cadet/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: next })
      }).catch(() => {});
    }, 500);

    // Optional realtime broadcast (if you want socket-driven updates)
    if (socket && status?.team?.id && status?.team?.members?.[0]?.userId) {
      // If you have userId on client, pass it; otherwise remove this block.
    }
  }

  if (!status) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Tryout</h1>
        {msg ? <p style={{ color: "crimson" }}>{msg}</p> : <p>Loading…</p>}
        <Link href="/cadet">Back</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Tryout: {status.team.name}</h1>

      {status.state !== "ACTIVE" ? (
        <>
          <p>Status: <b>{status.state}</b></p>
          <button onClick={start}>Start 4-hour tryout</button>
          <p style={{ marginTop: 8, color: "#555" }}>
            Starting activates the timer for the whole team.
          </p>
        </>
      ) : (
        <>
          <p>Time remaining: <b style={{ fontSize: 18 }}>{remaining}</b></p>

          <p style={{ marginTop: 8 }}>
            <b>Case Files:</b>{" "}
            <Link href="/cadet/case">Overview</Link> ·{" "}
            <Link href="/cadet/people">People</Link> ·{" "}
            <Link href="/cadet/locations">Locations</Link> ·{" "}
            <Link href="/cadet/evidence">Evidence</Link>
          </p>

          <section style={{ marginTop: 16 }}>
            <h2>Shared Team Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => updateNotes(e.target.value)}
              rows={16}
              style={{ width: "100%", fontFamily: "ui-monospace, Menlo, monospace" }}
            />
          </section>

          <section style={{ marginTop: 16 }}>
            <Link href="/cadet/final">Go to Final Questions</Link>
          </section>
        </>
      )}

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      <p style={{ marginTop: 16 }}>
        <Link href="/cadet">Back</Link> · <Link href="/logout">Logout</Link>
      </p>
    </main>
  );
}
