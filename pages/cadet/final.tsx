import { useEffect, useState } from "react";
import Link from "next/link";

export default function Final() {
  const [status, setStatus] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [q4, setQ4] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/cadet/status");
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.error || "Blocked");
        return;
      }
      setStatus(data);
    })();
  }, []);

  async function submit() {
    setMsg(null);
    const r = await fetch("/api/cadet/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          compromisedOfficer: q1,
          contactChain: q2,
          adversaryObjective: q3,
          opPlan: q4
        }
      })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Submit failed");
    setMsg("Submitted. Instructor will grade.");
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Final Questions</h1>

      {!status ? <p>Loading…</p> : <p>Status: <b>{status.state}</b></p>}
      {msg && <p style={{ color: msg.startsWith("Submitted") ? "green" : "crimson" }}>{msg}</p>}

      <div style={{ marginTop: 16 }}>
        <label><b>1) Who is the compromised supply officer? Cite your reasoning.</b></label>
        <textarea rows={4} style={{ width: "100%" }} value={q1} onChange={(e) => setQ1(e.target.value)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <label><b>2) Map the contact chain (aliases → likely real identity).</b></label>
        <textarea rows={4} style={{ width: "100%" }} value={q2} onChange={(e) => setQ2(e.target.value)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <label><b>3) What’s the adversary’s objective?</b></label>
        <textarea rows={4} style={{ width: "100%" }} value={q3} onChange={(e) => setQ3(e.target.value)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <label><b>4) Recommend an operational plan that minimizes exposure risk (OPSEC-first).</b></label>
        <textarea rows={4} style={{ width: "100%" }} value={q4} onChange={(e) => setQ4(e.target.value)} />
      </div>

      <button onClick={submit} style={{ marginTop: 16 }}>Submit</button>

      <p style={{ marginTop: 16 }}>
        <Link href="/cadet/tryout">Back to Tryout</Link> · <Link href="/cadet">Cadet Home</Link>
      </p>
    </main>
  );
}
