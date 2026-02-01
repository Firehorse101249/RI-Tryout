import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import Link from "next/link";




let socket: any = null;

export default function Tryout() {
    const [status, setStatus] = useState<any>(null);
    const [notes, setNotes] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
  
    const saveTimerRef = useRef<any>(null);
  
    const notesKey = status?.team?.id ? `ri_notes_${status.team.id}` : null;
  
    // Load notes from localStorage (fast)
    useEffect(() => {
      if (!notesKey) return;
      const saved = localStorage.getItem(notesKey);
      if (saved) setNotes(saved);
    }, [notesKey]);
  
    // Persist notes to localStorage (survives navigation)
    useEffect(() => {
      if (!notesKey) return;
      localStorage.setItem(notesKey, notes);
    }, [notesKey, notes]);
  
    // Load notes from DB once the tryout is ACTIVE (source of truth)
    useEffect(() => {
      if (!status || status.state !== "ACTIVE") return;
  
      (async () => {
        try {
          const r = await fetch("/api/cadet/notes");
          const data = await r.json();
          if (r.ok) setNotes(data.content || "");
        } catch {}
      })();
    }, [status?.state, status?.team?.id]);
  

  const tickRef = useRef<any>(null);

  async function refresh() {
    const r = await fetch("/api/cadet/status");
    const data = await r.json();
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

  useEffect(() => {
    if (!status?.team?.id) return;

    // init socket once
    if (!socket) {
      socket = io({ path: "/socket.io" });
    }

    socket.emit("team:join", { teamId: status.team.id });

    // Load current notes from status/team fetch via instructor endpoint is heavy; we’ll just pull via instructor team endpoint later.
    // For v1: fetch team notes through instructor team endpoint is restricted, so we keep notes in socket sync after first update.
    socket.on("notes:sync", (payload: any) => {
        if (typeof payload?.content === "string") setNotes(payload.content);
      });      

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
    const r = await fetch("/api/cadet/start", { method: "POST" });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Start failed");
    setMsg(null);
    refresh();
  }

  function updateNotes(next: string) {
    setNotes(next);
  
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch("/api/cadet/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: next })
      }).catch(() => {});
    }, 500);
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
            Starting activates the timer for the whole team. If it expires, you’ll be locked until an instructor unlocks attempt #2.
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
            <h2>Mission Brief (Pilot)</h2>
            <p><b>Case:</b> Ghost Signal in the Mid Rim</p>
            <ul>
              <li>Identify the compromised supply officer</li>
              <li>Map the contact chain (aliases)</li>
              <li>Determine objective + recommended op plan</li>
              <li>Maintain OPSEC: don’t copy/share outside this console</li>
            </ul>
            <p style={{ color: "#666" }}>
              In v1, evidence is embedded as narrative. In v2 we’ll add gated artifacts + tasks + red herrings.
            </p>
          </section>

          <section style={{ marginTop: 16 }}>
            <h2>Shared Team Notes (Realtime)</h2>
            <textarea
              value={notes}
              onChange={(e) => updateNotes(e.target.value)}
              rows={16}
              style={{ width: "100%", fontFamily: "ui-monospace, Menlo, monospace" }}
            />
            <p style={{ color: "#666" }}>Edits are logged in the audit trail.</p>
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
