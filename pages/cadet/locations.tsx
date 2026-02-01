import Link from "next/link";
import { CASE } from "../../lib/caseData";

export default function LocationsList() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Locations</h1>
      <ul>
        {CASE.locations.map(l => (
          <li key={l.id}>
            <Link href={`/cadet/locations/${l.id}`}>{l.name}</Link> — {l.type}
          </li>
        ))}
      </ul>
      <p><Link href="/cadet/case">Back to Case</Link></p>
    </main>
  );
}
