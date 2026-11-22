// Who is signed in (GET /v1/account/me), shared by every page.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { account, ApiError, type Me } from "./api";

interface Session {
  me: Me | null;
  /** True until the first answer. */
  loading: boolean;
  reload: () => Promise<Me | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<Session>({ me: null, loading: true, reload: async () => null, signOut: async () => undefined });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try {
      const m = await account.me();
      setMe(m);
      return m;
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) console.warn(e);
      setMe(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  /**
   * Signs out and leaves nothing of the account in this browser tab: the cloud ends the session, clears the cookie and
   * (Clear-Site-Data) the cache and storage; this also clears storage itself and reloads the page, so nothing loaded
   * for the account (downloads, analytics, licences) stays in memory for the next person on a shared PC.
   */
  const signOut = useCallback(async () => {
    await account.logout().catch(() => undefined);
    setMe(null);
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* storage off */ }
    window.location.replace("/");
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return <Ctx.Provider value={{ me, loading, reload, signOut }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
