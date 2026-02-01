import Link from "next/link";
import { CASE } from "../../lib/caseData";

export default function PeopleList() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>People Profiles</h1>
      <ul>
        {CASE.people.map(p => (
          <li key={p.id}>
            <Link href={`/cadet/people/${p.id}`}>{p.name}</Link> — {p.role}
          </li>
        ))}
      </ul>
      <p><Link href="/cadet/case">Back to Case</Link></p>
    </main>
  );
}
