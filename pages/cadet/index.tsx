import { useEffect, useState } from "react";
import Link from "next/link";

export default function CadetHome() {
  const [me, setMe] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const m = await (await fetch("/api/me")).json();
      setMe(m.user);
      const t = await (await fetch("/api/cadet/team")).json();
      setTeam(t.team);
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

      {!team ? (
        <p>You are not assigned to a team yet. Ask an instructor to add you.</p>
      ) : (
        <>
          <p>Team: <b>{team.name}</b></p>
          <p>Case: <b>{team.caseId}</b></p>
          <p>Session status: <b>{team.session?.status || "NOT_STARTED"}</b></p>
          <Link href="/cadet/tryout">Enter Tryout</Link>
        </>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/logout">Logout</Link>
      </p>
    </main>
  );
}
