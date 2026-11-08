// A small history router: the portal has a handful of pages, so no router library.
import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

const listeners = new Set<() => void>();

export function navigate(to: string, o: { replace?: boolean } = {}): void {
  if (o.replace) history.replaceState(null, "", to); else history.pushState(null, "", to);
  window.scrollTo(0, 0);
  for (const l of listeners) l();
}

/** The current location (path and query), updated on navigate() and the browser's back and forward. */
export function useLocation(): { path: string; query: URLSearchParams } {
  const read = () => ({ path: normalisePath(location.pathname), query: new URLSearchParams(location.search) });
  const [loc, setLoc] = useState(read);
  useEffect(() => {
    const update = () => setLoc(read());
    listeners.add(update);
    window.addEventListener("popstate", update);
    return () => { listeners.delete(update); window.removeEventListener("popstate", update); };
  }, []);
  return loc;
}

/** "/app/" and "/app" are the same page. */
export function normalisePath(path: string): string {
  const p = path.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={click} {...rest} />;
}
