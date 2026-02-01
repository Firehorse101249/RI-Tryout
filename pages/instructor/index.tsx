import { useEffect, useState } from "react";
import Link from "next/link";

export default function InstructorHome() {
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const m = await (await fetch("/api/me")).json();
      setMe(m.user);
    })();
  }, []);

  if (!me) return <main style={{ padding: 24, fontFamily: "system-ui" }}>Loading…</main>;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Instructor Console</h1>
      <p>Logged in as: <b>{me.username}</b> ({me.role})</p>

      <ul>
        <li><Link href="/instructor/users">Create Users + Assign Teams</Link></li>
        <li><Link href="/instructor/teams">Teams + Audit Logs + Unlock</Link></li>
      </ul>

      <p><Link href="/logout">Logout</Link></p>
    </main>
  );
}
