import { useEffect, useState } from "react";
import Link from "next/link";

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);

  async function load() {
    const r = await fetch("/api/instructor/teams");
    const data = await r.json();
    setTeams(data.teams || []);
  }

  async function deleteTeam(teamId: string, name: string) {
    const typed = prompt(`Type DELETE to permanently delete team "${name}"`, "");
    if (typed !== "DELETE") return;
  
    const r = await fetch("/api/instructor/delete-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId })
    });
  
    const data = await r.json();
    if (!r.ok) {
      alert(data.error || "Delete failed");
      return;
    }
  
    alert("Team deleted.");
    load(); // refresh list
  }
  

  useEffect(() => { load(); }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Teams</h1>
      <button onClick={load}>Refresh</button>

      <ul>
      {teams.map(t => (
  <li key={t.id} style={{ marginTop: 12 }}>
    <Link href={`/instructor/team/${t.id}`}>{t.name}</Link>
    {" "}— JoinCode: <b>{t.joinCode}</b>
    {" "}— Session: <b>{t.session?.status || "NOT_STARTED"}</b>
    {" "}— Attempt: <b>{t.session?.attemptNumber || 1}</b>
    {" "}— Members: <b>{t.members?.length || 0}</b>

    {" "}
    <button
      onClick={() => deleteTeam(t.id, t.name)}
      style={{ marginLeft: 12, color: "crimson" }}
    >
      Delete
    </button>
  </li>
))}

      </ul>

      <p style={{ marginTop: 16 }}>
        <Link href="/instructor">Back</Link>
      </p>
    </main>
  );
}
