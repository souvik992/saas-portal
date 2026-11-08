import { useEffect } from "react";
import { navigate } from "../router";
import { useSession } from "../session";

/** The signed-in client area (P8-07 adds its pages). Signed-out visitors go to sign in and come back. */
export function ClientArea({ path }: { path: string }) {
  const { me, loading } = useSession();
  useEffect(() => {
    if (!loading && !me) navigate(`/login?next=${encodeURIComponent(path)}`, { replace: true });
  }, [loading, me, path]);
  if (!me) return <div className="wrap empty">Loading…</div>;
  return (
    <div className="wrap">
      <div className="area-head"><h1>Hello, {me.user.name.split(" ")[0]}</h1></div>
    </div>
  );
}
