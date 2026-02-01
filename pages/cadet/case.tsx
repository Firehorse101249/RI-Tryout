import Link from "next/link";
import { CASE } from "../../lib/caseData";

export default function CaseOverview() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
      <h1>{CASE.title}</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{CASE.overview}</pre>

      <h2>Objectives</h2>
      <ol>
        {CASE.objectives.map((o) => <li key={o}>{o}</li>)}
      </ol>

      <h2>Browse</h2>
      <ul>
        <li><Link href="/cadet/people">People Profiles (12)</Link></li>
        <li><Link href="/cadet/locations">Locations</Link></li>
        <li><Link href="/cadet/evidence">Evidence Archive</Link></li>
      </ul>

      <p><Link href="/cadet/tryout">Back to Tryout</Link></p>
    </main>
  );
}
