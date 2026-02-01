import { useEffect, useState } from "react";
import Link from "next/link";

export default function EvidenceList() {
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/cadet/case-slice?kind=evidence");
        const data = await r.json();
        if (!r.ok) {
          setMsg(data.error || "Failed to load evidence");
          return;
        }
        setItems(data.items || []);
      } catch {
        setMsg("Network error");
      }
    })();
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Evidence Archive</h1>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      <ul>
        {items.map((e) => (
          <li key={e.id}>
            <Link href={`/cadet/evidence/${e.id}`}>{e.id}</Link>
            {" "}— {e.title} ({e.type})
          </li>
        ))}
      </ul>

      {items.length === 0 && !msg && (
        <p style={{ color: "#666" }}>
          No evidence assigned to your access partition.
          Coordinate with your team.
        </p>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/cadet/case">Back to Case</Link> ·{" "}
        <Link href="/cadet/tryout">Back to Tryout</Link>
      </p>
    </main>
  );
}
