import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { Forgot, Login, Register } from "./pages/Auth";
import { ClientArea } from "./pages/ClientArea";
import { Link, navigate, useLocation } from "./router";
import { SessionProvider, useSession } from "./session";

/**
 * Sign-in pages (/, /login, /register, /forgot) are for people who are not signed in; a signed-in person goes straight
 * to the dashboard. "/" is the sign-in page itself (the portal has no public home page).
 */
function SignedOutOnly({ children }: { children: React.ReactNode }) {
  const { me, loading } = useSession();
  const { query } = useLocation();
  const next = query.get("next")?.startsWith("/app") ? query.get("next")! : "/app";
  useEffect(() => { if (!loading && me) navigate(next, { replace: true }); }, [loading, me, next]);
  if (loading || me) return <div className="wrap empty" aria-busy="true"><p className="muted">Loading…</p></div>;
  return <>{children}</>;
}

function Page() {
  const { path } = useLocation();
  if (path === "/" || path === "/login") return <SignedOutOnly><Login /></SignedOutOnly>;
  if (path === "/register" || path === "/signup") return <SignedOutOnly><Register /></SignedOutOnly>;
  if (path === "/forgot") return <SignedOutOnly><Forgot /></SignedOutOnly>;
  if (path === "/app" || path.startsWith("/app/")) return <ClientArea path={path} />;
  return (
    <div className="wrap empty">
      <h1>Page not found</h1>
      <p className="muted" style={{ marginTop: 12 }}><Link to="/">Go to sign in</Link></p>
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <Layout><Page /></Layout>
    </SessionProvider>
  );
}
