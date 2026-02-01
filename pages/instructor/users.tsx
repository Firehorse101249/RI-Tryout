import { useEffect, useState } from "react";
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

  // management
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  async function loadUsers() {
    setLoadingUsers(true);
    setMsg(null);
    try {
      const r = await fetch("/api/instructor/users");
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.error || "Failed to load users");
        setUsers([]);
      } else {
        setUsers(data.users || []);
      }
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

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
    setU("");
    setP("");
    loadUsers();
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
    loadUsers();
  }

  // --- Management actions ---
  async function setLock(userId: string, lockedReason: string | null) {
    setMsg(null);
    const r = await fetch("/api/instructor/set-user-lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, lockedReason })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Lock update failed");
    setMsg(lockedReason ? "User locked." : "User unlocked.");
    loadUsers();
  }

  async function removeFromTeams(userId: string) {
    if (!confirm("Remove this user from all teams?")) return;
    setMsg(null);
    const r = await fetch("/api/instructor/set-user-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, teamId: null })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Remove failed");
    setMsg("Removed from teams.");
    loadUsers();
  }

  async function assignToTeamById(userId: string) {
    const teamId = prompt("Enter teamId to assign user to:", "");
    if (!teamId) return;

    setMsg(null);
    const r = await fetch("/api/instructor/set-user-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, teamId })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Assign failed");
    setMsg("Assigned to team.");
    loadUsers();
  }

  async function deleteUser(userId: string, username: string) {
    const typed = prompt(`Type DELETE to permanently remove user "${username}"`, "");
    if (typed !== "DELETE") return;

    setMsg(null);
    const r = await fetch("/api/instructor/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || "Delete failed");
    setMsg("User deleted.");
    loadUsers();
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980 }}>
      <h1>Instructor — Users & Teams</h1>

      {msg && <p style={{ color: msg.toLowerCase().includes("failed") ? "crimson" : "black" }}>{msg}</p>}

      {/* CREATE USER */}
      <section style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16, borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Create User</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="username" value={u} onChange={(e) => setU(e.target.value)} />
          <input placeholder="password" value={p} onChange={(e) => setP(e.target.value)} type="password" />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="CADET">CADET</option>
            <option value="INSTRUCTOR">INSTRUCTOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button onClick={createUser}>Create</button>
        </div>
      </section>

      {/* CREATE TEAM */}
      <section style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16, borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Create Team</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          <button onClick={createTeam}>Create Team</button>
        </div>
        {teamJoinCode && (
          <p style={{ marginTop: 8 }}>
            <b>Join code:</b> {teamJoinCode}
          </p>
        )}
      </section>

      {/* ADD USER TO TEAM BY JOIN CODE */}
      <section style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16, borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Add User to Team (Join Code)</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="cadet username" value={assignUser} onChange={(e) => setAssignUser(e.target.value)} />
          <input placeholder="team join code" value={assignCode} onChange={(e) => setAssignCode(e.target.value)} />
          <button onClick={addToTeam}>Add</button>
        </div>
      </section>

      {/* USER MANAGEMENT TABLE */}
      <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h2 style={{ marginTop: 0 }}>User Management</h2>
          <button onClick={loadUsers} disabled={loadingUsers}>
            {loadingUsers ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {users.length === 0 ? (
          <p style={{ color: "#666" }}>{loadingUsers ? "Loading…" : "No users returned."}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Username</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Role</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Locked</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Teams</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const teams = (user.memberships || []).map((m: any) => m.team);
                  return (
                    <tr key={user.id}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                        <b>{user.username}</b>
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{user.role}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                        {user.lockedReason ? (
                          <span title={user.lockedReason}>YES</span>
                        ) : (
                          "no"
                        )}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                        {teams.length ? (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {teams.map((t: any) => (
                              <li key={t.id}>
                                {t.name} <span style={{ color: "#666" }}>({t.joinCode})</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ color: "#666" }}>(none)</span>
                        )}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {user.lockedReason ? (
                            <button onClick={() => setLock(user.id, null)}>Unlock</button>
                          ) : (
                            <button
                              onClick={() => {
                                const reason = prompt("Lock reason:", "Instructor lock");
                                if (!reason) return;
                                setLock(user.id, reason);
                              }}
                            >
                              Lock
                            </button>
                          )}

                          <button onClick={() => assignToTeamById(user.id)}>Assign teamId</button>
                          <button onClick={() => removeFromTeams(user.id)}>Remove from teams</button>

                          <button onClick={() => deleteUser(user.id, user.username)} style={{ color: "crimson" }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={{ marginTop: 16 }}>
        <Link href="/instructor">Back</Link> · <Link href="/instructor/teams">Teams</Link>
      </p>
    </main>
  );
}
