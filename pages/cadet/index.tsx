import { useEffect, useState } from "react";
import Link from "next/link";

export default function CadetHome() {
  const [me, setMe] = useState<any>(null);
  const [dash, setDash] = useState<any>(null);


  useEffect(() => {
    (async () => {
      const m = await (await fetch("/api/me")).json();
      setMe(m.user);
      const d = await (await fetch("/api/cadet/dashboard")).json();
      setDash(d);
      
    })();
  }, []);

  if (!me) return <main style={{ padding: 24, fontFamily: "system-ui" }}>Loading…</main>;
  if (me.lockedReason) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Locked</h1>
        <p>{me.lockedReason}</p>
        <p>Instructor unlock required for attempt #2.</p>
        <Link href="/logout">Logout</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Cadet Console</h1>
      <p>Logged in as: <b>{me.username}</b></p>
      {dash?.hasTeam && (
  <section style={{ marginTop: 12, border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
    <h2 style={{ marginTop: 0 }}>Results</h2>

    {dash.submission ? (
      dash.submission.score == null ? (
        <p><b>Submitted.</b> Waiting for instructor grade.</p>
      ) : (
        <>
          <p>Score: <b>{dash.submission.score}</b>/100</p>
          {dash.submission.instructorNotes && (
            <>
              <p><b>Instructor Notes:</b></p>
              <div style={{ whiteSpace: "pre-wrap", border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
                {dash.submission.instructorNotes}
              </div>
            </>
          )}
        </>
      )
    ) : (
      <p>No submission yet for attempt <b>{dash.attempt}</b>.</p>
    )}
  </section>
)}


{!dash ? (
  <p>Loading team…</p>
) : !dash.hasTeam ? (
  <p>You are not assigned to a team yet. Ask an instructor to add you.</p>
) : (
  <>
    <p>Team: <b>{dash.team.name}</b></p>
    <p>Attempt: <b>{dash.attempt}</b></p>

    {/* Gate tryout entry if waiting on grade */}
    {dash.submission && dash.submission.score == null ? (
      <p style={{ color: "#a00" }}>
        Tryout is locked while waiting for instructor grading.
      </p>
    ) : (
      <Link href="/cadet/tryout">Enter Tryout</Link>
    )}
  </>
)}
