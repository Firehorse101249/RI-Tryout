import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CASE, RUBRIC } from "../../../lib/caseData";


export default function TeamDetail() {
  const router = useRouter();
  const teamId = String(router.query.id || "");
  const [team, setTeam] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!teamId) return;
    const r = await fetch(`/api/instructor/team/${teamId}`);
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Failed");
    setTeam(data.team);
    setMsg(null);
    
  }

  useEffect(() => { load(); }, [teamId]);

  async function unlock() {
    setMsg(null);
    const r = await fetch("/api/instructor/unlock-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Unlock failed");
    setMsg("Unlocked for next attempt.");
    load();
  }

  async function grade(submissionId: string) {
    const scoreStr = prompt("Score (0-100):", "85");
    if (!scoreStr) return;
    const score = Number(scoreStr);
    const notes = prompt("Instructor notes (optional):", "") || "";

    const r = await fetch("/api/instructor/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, score, notes })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Grade failed");
    setMsg("Graded.");
    load();
  }

  if (!team) return <main style={{ padding: 24, fontFamily: "system-ui" }}>Loading… {msg && <p>{msg}</p>}</main>;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>{team.name}</h1>
      <p>Join code: <b>{team.joinCode}</b></p>
      <p>Session: <b>{team.session?.status || "NOT_STARTED"}</b> · Attempt: <b>{team.session?.attemptNumber || 1}</b></p>
      {team.session?.endsAt && <p>Ends at: {new Date(team.session.endsAt).toLocaleString()}</p>}

      <button onClick={unlock}>Unlock Team (Next Attempt)</button>
      {msg && <p>{msg}</p>}

      <h2 style={{ marginTop: 16 }}>Members</h2>
      <ul>
      {team.members.map((m: any) => (
          <li key={m.user.id}>
            {m.user.username} — role: {m.user.role} — locked: <b>{m.user.lockedReason ? "YES" : "no"}</b>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 16 }}>Team Notes (Saved)</h2>
{team.notes?.content ? (
  <div style={{ whiteSpace: "pre-wrap", border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
    {team.notes.content}
  </div>
) : (
  <p style={{ color: "#666" }}>(No notes saved yet)</p>
)}


      <h2 style={{ marginTop: 16 }}>Recent Audit Log</h2>
      <ol>
        {team.audits.map((a: any) => (
          <li key={a.id} style={{ marginBottom: 6 }}>
            <b>{a.type}</b> — {new Date(a.createdAt).toLocaleString()}
            {a.user?.username ? ` — by ${a.user.username}` : (a.userId ? ` — by ${a.userId.slice(0, 6)}` : "")}
          </li>
        ))}
      </ol>

      <h2 style={{ marginTop: 16 }}>Submissions</h2>
      {team.submissions.length === 0 ? <p>None yet.</p> : (
        <ul>
          {team.submissions.map((s: any) => (
            <li key={s.id} style={{ marginBottom: 10 }}>
              <b>{s.user.username}</b> — attempt {s.attemptNumber} — submitted {new Date(s.createdAt).toLocaleString()}
              {" "}— score: <b>{s.score ?? "UNSCORED"}</b>
              {" "}
              <button onClick={() => grade(s.id)}>Grade</button>
              <details>
                <summary>View answers</summary>
                {Array.isArray(s.answersJson?.responses) ? (
  <div style={{ paddingTop: 8 }}>
    {CASE.finalQuestions.map((q, i) => {
  const rubric = (RUBRIC as any[]).find((r) => r.q === i + 1);

  return (
    <div key={q} style={{ marginBottom: 12 }}>
      <div><b>{i + 1}) {q}</b></div>

      <div style={{ whiteSpace: "pre-wrap", border: "1px solid #ddd", padding: 10, borderRadius: 8 }}>
        {String(s.answersJson.responses[i] || "").trim() || <i>(no answer)</i>}
      </div>

      {rubric?.keyPoints?.length ? (
        <details style={{ marginTop: 8 }}>
          <summary>Rubric / expected points</summary>
          <ul>
            {rubric.keyPoints.map((kp: string) => (
              <li key={kp}>{kp}</li>
            ))}
          </ul>
        </details>
      ) : (
        <p style={{ marginTop: 8, color: "#666" }}>(No rubric added for this question yet)</p>
      )}
    </div>
  );
})}

  </div>
) : (
  <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(s.answersJson, null, 2)}</pre>
)}

              </details>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/instructor/teams">Back</Link>
      </p>
    </main>
  );
}
