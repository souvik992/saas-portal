import type { ReactNode } from "react";
import { Link, navigate } from "../router";
import { useSession } from "../session";

/** The POSINEXT logo, as on posinext.com: two chevrons (orange and dark) and the name. */
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="POSINEXT home">
      <svg className="brand-mark" viewBox="0 0 32 24" aria-hidden="true">
        <path d="M2 2 L12 12 L2 22 H8 L18 12 L8 2 Z" className="brand-mark-a" />
        <path d="M14 2 L24 12 L14 22 H20 L30 12 L20 2 Z" className="brand-mark-b" />
      </svg>
      POSINEXT
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
          <span className="spacer" />
          {me ? (
            <>
              <Link to="/app" className="btn">Dashboard</Link>
              <button className="btn btn-ghost" onClick={() => void signOut().then(() => navigate("/"))}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/" className="btn btn-ghost">Sign in</Link>
              <Link to="/register" className="btn btn-primary"><span className="label-long">Create account</span><span className="label-short">Sign up</span></Link>
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
