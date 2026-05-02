export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "80px auto", padding: "0 16px" }}>
      <h1>Cashtoroid</h1>
      <p>Content Rewards System API is running.</p>
      <ul>
        <li><code>POST /api/register</code> — Create account</li>
        <li><code>POST /api/auth/signin</code> — Sign in</li>
        <li><code>POST /api/videos/submit</code> — Submit a video</li>
        <li><code>GET /api/videos/my-videos</code> — My videos</li>
        <li><code>GET /api/leaderboard</code> — Public leaderboard</li>
        <li><code>GET /api/admin/*</code> — Admin panel (admin role required)</li>
      </ul>
    </main>
  );
}
