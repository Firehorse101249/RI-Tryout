import { useEffect, useState } from "react";
import Link from "next/link";
import { CASE } from "../../lib/caseData";

export default function Final() {
  const [status, setStatus] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [answers, setAnswers] = useState<string[]>(
    Array(CASE.finalQuestions.length).fill("")
  );
  

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
        answers: { responses: answers }
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

      {CASE.finalQuestions.map((q, i) => (
  <div key={q} style={{ marginTop: 16 }}>
    <label><b>{i + 1}) {q}</b></label>
    <textarea
      rows={4}
      style={{ width: "100%" }}
      value={answers[i]}
      onChange={(e) => {
        const next = [...answers];
        next[i] = e.target.value;
        setAnswers(next);
      }}
    />
  </div>
))}


      <button onClick={submit} style={{ marginTop: 16 }}>Submit</button>

      <p style={{ marginTop: 16 }}>
        <Link href="/cadet/tryout">Back to Tryout</Link> · <Link href="/cadet">Cadet Home</Link>
      </p>
    </main>
  );
}
