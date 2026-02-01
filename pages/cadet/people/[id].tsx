import Link from "next/link";
import { useRouter } from "next/router";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

export default function PersonPage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const person = CASE.people.find(p => p.id === id);

  if (!person) return <main style={{ padding: 24, fontFamily: "system-ui" }}>Not found.</main>;

  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>{person.name}</h1>
        <p><b>Role:</b> {person.role}</p>
        <p><b>Aliases:</b> {person.alias.join(", ")}</p>

        <h2>Bio</h2>
        <p>{person.bio}</p>

        <h2>Credible Info</h2>
        <ul>{person.credibleInfo.map(x => <li key={x}>{x}</li>)}</ul>

        <h2>Red Flags</h2>
        <ul>{person.redFlags.map(x => <li key={x}>{x}</li>)}</ul>

        <h2>Known Connections</h2>
        <ul>
          {person.knownConnections.map(pid => {
            const other = CASE.people.find(p => p.id === pid);
            return other ? (
              <li key={pid}><Link href={`/cadet/people/${pid}`}>{other.name}</Link> — {other.role}</li>
            ) : null;
          })}
        </ul>

        <p><Link href="/cadet/people">Back to People</Link> · <Link href="/cadet/case">Case</Link></p>
      </main>
    </EvidenceGuard>
  );
}
