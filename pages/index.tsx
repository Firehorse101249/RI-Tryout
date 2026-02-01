import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Republic Intelligence Tryout</h1>
      <p>Login to begin.</p>
      <Link href="/login">Go to login</Link>
    </main>
  );
}
