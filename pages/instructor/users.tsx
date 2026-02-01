import { useState } from "react";
import Link from "next/link";

export default function Users() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [role, setRole] = useState("CADET");
  const [msg, setMsg] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("Alpha");
  const [teamJoinCode, setTeamJoinCode] = useState<string | null>(null);

  const [assignUser, setAssignUser] = useState("");
  const [assignCode, setAssignCode] = useState("");

  async function createUser() {
    setMsg(null);
    const r = await fetch("/api/instructor/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p, role })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Failed");
    setMsg("User created.");
  }

  async function createTeam() {
    setMsg(null);
    const r = await fetch("/api/instructor/create-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Failed");
    setTeamJoinCode(data.team.joinCode);
    setAssignCode(data.team.joinCode);
    setMsg(`Team created. Join code: ${data.team.joinCode}`);
  }

  async function addToTeam() {
    setMsg(null);
    const r = await fetch("/api/instructor/add-to-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: assignUser, joinCode: assignCode })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Failed");
    setMsg("Added to team.");
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 720 }}>
      <h1>Create Users & Teams</h1>

      {msg && <p>{msg}</p>}

      <section style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <h2>Create User</h2>
        <input placeholder="username" value={u} onChange={(e) => setU(e.target.value)} />
        <input placeholder="password" value={p} onChange={(e) => setP(e.target.value)} type="password" />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="CADET">CADET</option>
          <option value="INSTRUCTOR">INSTRUCTOR</option>
        </select>
        <button onClick={createUser}>Create</button>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <h2>Create Team</h2>
        <input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        <button onClick={createTeam}>Create Team</button>
        {teamJoinCode && <p><b>Join code:</b> {teamJoinCode}</p>}
      </section>

      <section style={{ border: "1px solid #ddd", padding: 12 }}>
        <h2>Add User to Team</h2>
        <input placeholder="cadet username" value={assignUser} onChange={(e) => setAssignUser(e.target.value)} />
        <input placeholder="team join code" value={assignCode} onChange={(e) => setAssignCode(e.target.value)} />
        <button onClick={addToTeam}>Add</button>
      </section>

      <p style={{ marginTop: 16 }}>
        <Link href="/instructor">Back</Link> · <Link href="/instructor/teams">Teams</Link>
      </p>
    </main>
  );
}
