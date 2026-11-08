import { UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";
import { Link, navigate } from "../router";
import { useSession } from "../session";

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="posinext home">
      <span className="brand-mark" aria-hidden><UtensilsCrossed size={18} strokeWidth={2.4} /></span>
      posinext
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { me, signOut } = useSession();
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Brand />
          <nav className="nav" aria-label="Main">
            <a href="/#products">Products</a>
            <a href="/#how">How it works</a>
          </nav>
          <span className="spacer" />
          {me ? (
            <>
              <Link to="/app" className="btn">Client area</Link>
              <button className="btn btn-ghost" onClick={() => void signOut().then(() => navigate("/"))}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign in</Link>
              <Link to="/register" className="btn btn-primary"><span className="label-long">Start free trial</span><span className="label-short">Try free</span></Link>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="wrap">
          <span>© {new Date().getFullYear()} posinext</span>
          <span className="spacer" />
          <Link to="/app/support">Support</Link>
          <a href="mailto:support@posinext.com">support@posinext.com</a>
        </div>
      </footer>
    </>
  );
}

/** A form-level message (an error from the cloud, or a confirmation). */
export function Notice({ kind = "error", children }: { kind?: "error" | "ok" | "info"; children: ReactNode }) {
  if (!children) return null;
  return <div className={`notice${kind === "error" ? " notice-error" : kind === "ok" ? " notice-ok" : ""}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}
