import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: any) {
    e.preventDefault();
    setMsg(null);

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await r.json();
    if (!r.ok) {
      setMsg(data.error || "Login failed");
      return;
    }

    if (data.role === "CADET") router.push("/cadet");
    else router.push("/instructor");
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 420 }}>
      <h1>Login</h1>
      <form onSubmit={submit}>
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
        <button type="submit">Sign in</button>
      </form>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
      <p style={{ marginTop: 16 }}>
        <a href="/logout">Logout</a>
      </p>
    </main>
  );
}
