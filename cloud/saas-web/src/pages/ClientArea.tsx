import {
  Activity, ArrowRight, BarChart3, BookOpen, Boxes, Check, CreditCard, Download as DownloadIcon, KeyRound, LifeBuoy, Megaphone, MessageSquarePlus, Puzzle, Search, Smartphone, UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { account, ApiError, downloadHref, support, type Download, type Licence, type Me, type ProductCode, type SignIn } from "../api";
import { Notice } from "../components/Layout";
import { deviceName, formatSize, toggleProduct } from "../forms";
import { FREE_PLAN, PLANS, rupees } from "../plans";
import { PRODUCT_ORDER, productCopy } from "../products";
import { Link, navigate, useLocation } from "../router";
import { useSession } from "../session";
import { licenceSummary, seatsText, TRIAL_DAYS } from "../licence-summary";
import { AnalyticsPage } from "./Analytics";
import { InventoryPage } from "./Inventory";
import { Announcements, KnowledgeBase, ServiceStatus, SupportTickets } from "./Support";

/** The dashboard's tiles, in three groups. */
interface Tile { to: string; icon: typeof UserRound; title: string; about: string }
const GROUPS: Array<{ name: string; tiles: Tile[] }> = [
  { name: "Your business", tiles: [
    { to: "/app/analytics", icon: BarChart3, title: "Analytics", about: "Sales, orders and top items by outlet" },
    { to: "/app/inventory", icon: Boxes, title: "Purchases & stock", about: "Stock value, low stock and suppliers" },
    { to: "/app/account", icon: UserRound, title: "My account", about: "Business, products and password" },
    { to: "/app/licences", icon: KeyRound, title: "Licences", about: "PCs, trials and licence keys" },
    { to: "/app/plans", icon: CreditCard, title: "Plans & billing", about: "Free plan, or more PCs with a paid plan" },
  ] },
  { name: "Software", tiles: [
    { to: "/app/downloads", icon: DownloadIcon, title: "Downloads", about: "The Windows app for your products" },
    { to: "/app/addons", icon: Puzzle, title: "Add-ons", about: "Table QR, ODS and more" },
    { to: "/app/announcements", icon: Megaphone, title: "Announcements", about: "New versions and news" },
  ] },
  { name: "Help", tiles: [
    { to: "/app/kb", icon: BookOpen, title: "Knowledge base", about: "Guides and common answers" },
    { to: "/app/support/new", icon: MessageSquarePlus, title: "Submit a ticket", about: "Ask us for help" },
    { to: "/app/support", icon: LifeBuoy, title: "Support tickets", about: "See and answer your tickets" },
  ] },
];

const TITLES: Record<string, string> = {
  ...Object.fromEntries(GROUPS.flatMap((g) => g.tiles).map((t) => [t.to, t.title])),
  "/app/status": "Service status",
};

function AreaPage({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="wrap area">
      <div className="area-head">
        <div>
          <div className="crumbs"><Link to="/app">Client area</Link>{title !== "Client area" ? <> › {title}</> : null}</div>
          <h1>{title}</h1>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

/** Loads data for a page; shows a message when it fails. */
function useData<T>(load: () => Promise<T>, deps: unknown[] = []): { data: T | null; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    load().then((d) => { if (live) { setData(d); setError(null); } }, (e: unknown) => { if (live) setError(e instanceof ApiError ? e.message : "Could not load this page."); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, ...deps]);
  return { data, error, reload: () => setN((x) => x + 1) };
}

const date = (v: number | string) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const daysLeft = (end: number) => Math.ceil((end - Date.now()) / 86_400_000);

export function ClientArea({ path }: { path: string }) {
  const { me, loading } = useSession();
  useEffect(() => {
    if (!loading && !me) navigate(`/?next=${encodeURIComponent(path)}`, { replace: true });
  }, [loading, me, path]);
  if (!me) return <div className="wrap empty">Loading…</div>;
  switch (path) {
    case "/app": return <AreaHome me={me} />;
    case "/app/analytics": return <AnalyticsPage me={me} />;
    case "/app/inventory": return <InventoryPage me={me} />;
    case "/app/account": return <AccountPage me={me} />;
    case "/app/downloads": return <DownloadsPage me={me} kind="app" />;
    case "/app/addons": return <DownloadsPage me={me} kind="addon" />;
    case "/app/licences": return <LicencesPage />;
    case "/app/plans": return <PlansPage />;
    case "/app/support": return <AreaPage title="Support tickets"><SupportTickets /></AreaPage>;
    case "/app/support/new": return <AreaPage title="Submit a ticket"><SupportTickets compose /></AreaPage>;
    case "/app/announcements": return <AnnouncementsPage />;
    case "/app/kb": return <AreaPage title="Knowledge base"><KnowledgeBase /></AreaPage>;
    case "/app/status": return <AreaPage title="Service status"><ServiceStatus /></AreaPage>;
    default:
      if (path.startsWith("/app/support/")) return <AreaPage title="Support tickets"><SupportTickets ticketId={path.slice("/app/support/".length)} /></AreaPage>;
      return <AreaPage title="Not found"><p className="muted">This page does not exist. <Link to="/app">Back to the client area</Link></p></AreaPage>;
  }
}

/** When the announcements page was last opened (this browser), for the "N new" badge. */
const SEEN_KEY = "posinext.announcements.seen";
const readSeen = () => { try { return Number(localStorage.getItem(SEEN_KEY) ?? 0) || 0; } catch { return 0; } };
const markSeen = () => { try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* storage off: the badge just stays */ } };

function AnnouncementsPage() {
  useEffect(() => { markSeen(); }, []);
  return <AreaPage title="Announcements"><Announcements /></AreaPage>;
}

const greeting = (h = new Date().getHours()) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
/** The add-ons of these products, for the Add-ons tile. */
const ADDON_NAMES: Partial<Record<ProductCode, string[]>> = { fine_dine: ["Table QR", "Kitchen display", "Captain app"], tiffin_qsr: ["ODS"] };

function LicenceCard({ licences, products }: { licences: Licence[] | null; products: ProductCode[] }) {
  if (licences === null) return <div className="trial" aria-busy="true"><p className="label">Free trial</p><p className="big">&nbsp;</p><div className="bar" /></div>;
  const s = licenceSummary(licences, products);
  if (s.kind === "free") {
    return (
      <div className="trial">
        <p className="label">Free plan</p>
        <p className="big">Active</p>
        <p className="note">Every feature on one PC, at no cost · renews on its own while your PC is online</p>
        <Link to="/app/plans" className="btn btn-primary">More PCs and support <ArrowRight size={16} /></Link>
      </div>
    );
  }
  if (s.kind === "licensed") {
    return (
      <div className="trial">
        <p className="label">Licence</p>
        <p className="big">Active</p>
        <p className="note">Until {date(s.until!)} · renews on its own while your PC is online</p>
        <Link to="/app/licences" className="btn btn-primary">Manage licences <ArrowRight size={16} /></Link>
      </div>
    );
  }
  if (s.kind === "none") {
    return (
      <div className="trial">
        <p className="label">Free trial</p>
        <p className="big">{TRIAL_DAYS} days</p>
        <p className="note">Starts when you sign in inside the app on your outlet&rsquo;s PC. Then the Free plan: every feature on one PC, at no cost.</p>
        <Link to="/app/downloads" className="btn btn-primary">Download the app <ArrowRight size={16} /></Link>
      </div>
    );
  }
  const left = s.kind === "ended" ? 0 : s.daysLeft;
  return (
    <div className="trial">
      <p className="label">{s.kind === "ended" ? "Free trial ended" : "Free trial"}</p>
      <p className="big">{left} day{left === 1 ? "" : "s"} left</p>
      <div className="bar" role="progressbar" aria-label="Trial days left" aria-valuemin={0} aria-valuemax={TRIAL_DAYS} aria-valuenow={left}>
        <span style={{ width: `${Math.min(100, Math.round((left / TRIAL_DAYS) * 100))}%` }} />
      </div>
      <p className="note">{s.kind === "ended" ? "Choose a plan to keep billing." : "Then the Free plan keeps every feature on one PC, at no cost."}</p>
      <Link to="/app/plans" className="btn btn-primary">{s.kind === "ended" ? "Choose a plan" : "See the plans"} <ArrowRight size={16} /></Link>
    </div>
  );
}

function AreaHome({ me }: { me: Me }) {
  const { query } = useLocation();
  const welcome = query.get("welcome") === "1";
  const products = me.account.products;
  const names = products.map((p) => productCopy(p).name).join(" and ");
  const [licences, setLicences] = useState<Licence[] | null>(null);
  const [fresh, setFresh] = useState(0);
  const [status, setStatus] = useState<{ ok: boolean } | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    account.licences().then((r) => setLicences(r.licences), () => setLicences([]));
    const seen = readSeen();
    support.announcements().then((r) => setFresh(r.announcements.filter((a) => a.publishedAt > seen && (a.product === null || products.includes(a.product))).length), () => setFresh(0));
    support.status().then((s) => setStatus(s), () => setStatus({ ok: false }));
    if (!downloadsCache) loadDownloads().catch(() => { /* the Downloads page says so */ });
  }, [products]);
  const summary = licences ? licenceSummary(licences, products) : null;
  const badges: Record<string, string | null> = {
    "/app/plans": summary && summary.kind === "ended" ? "Action needed" : null,
    "/app/announcements": fresh > 0 ? `${fresh} new` : null,
  };
  const about: Record<string, string> = {
    "/app/addons": `${[...new Set(products.flatMap((p) => ADDON_NAMES[p] ?? []))].join(", ")} and more`,
  };
  const search = (e: FormEvent) => { e.preventDefault(); navigate(q.trim() ? `/app/kb?q=${encodeURIComponent(q.trim())}` : "/app/kb"); };
  const first = me.user.name.trim().split(/\s+/)[0] ?? "";
  return (
    <div className="wrap area">
      <section className="card dash-hero">
        <div>
          <p className="kicker">Client area</p>
          <h1>{greeting()}, <span className="accent">{first}</span></h1>
          <p className="sub">{me.account.name} • {names}</p>
          <form className="search" role="search" onSubmit={search}>
            <Search size={16} aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides and answers…" aria-label="Search the knowledge base" />
          </form>
        </div>
        <LicenceCard licences={licences} products={products} />
      </section>

      {welcome ? (
        <div className="card welcome stack">
          <h2 style={{ fontSize: 20 }}>Your account is ready. Next:</h2>
          <ol className="stack" style={{ margin: 0, paddingLeft: 20, gap: 8 }}>
            <li><b>Download</b> the Windows app for {names} and install it on your outlet&rsquo;s main PC.</li>
            <li><b>Sign in</b> in the app with this email and password, and choose <i>Start 30-day free trial</i>.</li>
          </ol>
          <div><Link to="/app/downloads" className="btn btn-primary">Go to downloads</Link></div>
        </div>
      ) : null}

      <div className="dash-groups">
        {GROUPS.map((g) => (
          <section key={g.name}>
            <h2>{g.name}</h2>
            <div className="tile-list">
              {g.tiles.map((t) => (
                <Link key={t.to} to={t.to} className="tile">
                  <span className="tile-icon"><t.icon size={20} /></span>
                  <span className="tile-text">
                    <span className="tile-title">{t.title}{badges[t.to] ? <span className="pill">{badges[t.to]}</span> : null}</span>
                    <span className="tile-desc">{about[t.to] ?? t.about}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link to="/app/status" className="statusbar">
        <span className="left">
          <span className={`dot${status && !status.ok ? " dot-bad" : ""}`} aria-hidden />
          <Activity size={16} aria-hidden />
          {status === null ? "Checking services…" : status.ok ? "All systems running" : "Some services have problems"}
        </span>
        <span className="go">Service status →</span>
      </Link>
    </div>
  );
}

/**
 * The downloads list, kept for this visit: Downloads and Add-ons share it, so moving between them (or coming back) shows
 * the list at once while a fresh copy loads behind it. The dashboard starts loading it early.
 */
let downloadsCache: Download[] | null = null;
let downloadsLoading: Promise<Download[]> | null = null;
function loadDownloads(): Promise<Download[]> {
  downloadsLoading ??= account.downloads().then(
    (r) => { downloadsCache = r.downloads; return r.downloads; },
  ).finally(() => { downloadsLoading = null; });
  return downloadsLoading;
}

type Os = "windows" | "mac" | "android";
const OS_NAME: Record<Os, string> = { windows: "Windows", mac: "Mac", android: "Android" };
/** Which system a download is for, from its file (or its id while no build is out). */
function osOf(d: Download): Os {
  const f = (d.fileName ?? "").toLowerCase();
  if (f.endsWith(".apk") || f.endsWith(".tiffinaddon")) return "android";
  if (f.endsWith(".dmg")) return "mac";
  if (f.endsWith(".exe")) return "windows";
  if (/android|captain/.test(d.id)) return "android";
  if (/mac/.test(d.id)) return "mac";
  return "windows";
}

function OsLogo({ os, size = 28 }: { os: Os; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (os === "windows") {
    return (
      <svg {...p} className="os-logo os-windows">
        <rect x="2" y="2" width="9.5" height="9.5" /><rect x="12.5" y="2" width="9.5" height="9.5" />
        <rect x="2" y="12.5" width="9.5" height="9.5" /><rect x="12.5" y="12.5" width="9.5" height="9.5" />
      </svg>
    );
  }
  if (os === "mac") {
    return (
      <svg {...p} className="os-logo os-mac">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    );
  }
  return (
    <svg {...p} className="os-logo os-android">
      <path d="M2.5 19a9.5 9.5 0 0 1 19 0z" />
      <path d="M6.2 7.6 4.6 5M17.8 7.6 19.4 5" strokeWidth="1.6" strokeLinecap="round" fill="none" stroke="currentColor" />
      <circle cx="8.3" cy="14.6" r="1.1" className="os-eye" /><circle cx="15.7" cy="14.6" r="1.1" className="os-eye" />
    </svg>
  );
}

function DownloadsPage({ me, kind }: { me: Me; kind: "app" | "addon" }) {
  const [list, setList] = useState<Download[] | null>(downloadsCache);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadDownloads().then((d) => { if (live) { setList(d); setError(null); } }, (e: unknown) => {
      if (live && !downloadsCache) setError(e instanceof ApiError ? e.message : "Could not load this page.");
    });
    return () => { live = false; };
  }, []);
  const mine = (list ?? []).filter((d) => d.kind === kind && me.account.products.includes(d.product));
  // one section per product, in the catalogue's order (each product's app first)
  const sections: Array<{ product: ProductCode; app: string; productName: string; items: Download[] }> = [];
  for (const d of mine) {
    const s = sections.find((x) => x.product === d.product);
    if (s) s.items.push(d); else sections.push({ product: d.product, app: d.app, productName: d.productName, items: [d] });
  }
  const title = TITLES[kind === "app" ? "/app/downloads" : "/app/addons"]!;
  return (
    <AreaPage title={title}>
      <Notice>{error}</Notice>
      <p className="muted" style={{ marginBottom: 8 }}>
        {kind === "app"
          ? "Pick your system. Install on the outlet's main device, then sign in inside the app with your account to start the 30-day trial."
          : "Add-ons work with the app on the main device. They are included in your trial. For an Android APK, allow \"Install unknown apps\" when asked."}
        {" "}Not seeing a product? <Link to="/app/account">Change your products</Link>.
      </p>
      {list === null && !error ? (
        <section className="dl-section" aria-busy="true">
          <div className="dl-head"><span className="skel" style={{ width: 160, height: 24 }} /></div>
          <div className="dl-grid">{[0, 1, 2].map((i) => <div key={i} className="card dl-block skel-block" />)}</div>
        </section>
      ) : null}
      {list !== null && sections.length === 0 ? <div className="card empty">Nothing here for your products yet.</div> : null}
      {sections.map((s) => (
        <section key={s.product} className="dl-section">
          <div className="dl-head">
            <h2>{kind === "app" ? s.app : `${s.app} add-ons`}</h2>
            <span className="pill pill-primary">{s.productName}</span>
            {kind === "app" ? (
              <span className="dl-oses" aria-label="Available for">
                {[...new Set(s.items.map(osOf))].map((os) => <span key={os} className="pill"><OsLogo os={os} size={12} />{OS_NAME[os]}</span>)}
              </span>
            ) : null}
          </div>
          <div className="dl-grid">{s.items.map((d) => <DownloadBlock key={d.id} d={d} />)}</div>
        </section>
      ))}
      {kind === "app" && sections.some((s) => s.items.some((d) => osOf(d) === "windows")) ? (
        <p className="muted small" style={{ marginTop: 16 }}>Windows may say the publisher is unknown: choose <i>More info › Run anyway</i>. Code signing is on its way.</p>
      ) : null}
    </AreaPage>
  );
}

function DownloadBlock({ d }: { d: Download }) {
  const os = osOf(d);
  // "quickPOS for Mac (Apple chip)" -> "Mac (Apple chip)": the section already names the app
  const variant = d.kind === "app" ? d.name.replace(/^.*?\bfor\s+/i, "") : d.name;
  return (
    <div className="card dl-block">
      <div className="dl-top">
        {d.kind === "app"
          ? <span className="dl-logo"><OsLogo os={os} /></span>
          : <span className="tile-icon">{d.id === "dinepos-captain" ? <Smartphone size={22} /> : <Puzzle size={22} />}</span>}
        {d.kind === "addon" ? <span className="pill"><OsLogo os={os} size={12} />{OS_NAME[os]}</span> : null}
      </div>
      <h3>{variant}</h3>
      <p className="small muted">{d.description}</p>
      <div className="dl-foot">
        <div className="meta">{d.available ? `Version ${d.version} · ${formatSize(d.size)} · ${date(d.publishedAt!)}` : "Coming soon: the first build is on its way."}</div>
        {d.available
          ? <a className="btn btn-primary btn-block" href={downloadHref(d.id)}><DownloadIcon size={16} /> Download</a>
          : <button className="btn btn-block" disabled>Not available yet</button>}
      </div>
    </div>
  );
}

function LicencesPage() {
  const { data, error } = useData(() => account.licences());
  const [open, setOpen] = useState<string | null>(null);
  const status = (l: Licence) => {
    if (l.revoked) return <span className="pill pill-danger">Revoked</span>;
    const left = daysLeft(l.expiresAt);
    if (left <= 0) return <span className="pill pill-danger">Ended</span>;
    return <span className={`pill ${left <= 7 ? "pill-warn" : "pill-ok"}`}>{l.kind === "trial" ? "Trial" : l.kind === "free" ? "Free plan" : "Active"} · {left} day{left === 1 ? "" : "s"} left</span>;
  };
  return (
    <AreaPage title="Licences">
      <Notice>{error}</Notice>
      <p className="muted" style={{ marginBottom: 16 }}>Each PC gets its key when you sign in inside the app. Keys renew by themselves while the PC is online.</p>
      <div className="card table-wrap">
        {data && data.licences.length === 0 ? (
          <div className="empty">No licences yet. <Link to="/app/downloads">Download the app</Link> and sign in on your PC to start a trial.</div>
        ) : null}
        {data && data.licences.length > 0 ? (
          <table className="table">
            <thead><tr><th>Product</th><th>Outlet and PC</th><th>Seats</th><th>Ends</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.licences.map((l) => (
                <tr key={l.id}>
                  <td><b>{productCopy(l.product).app}</b><div className="muted small">{productCopy(l.product).name}</div></td>
                  <td>{l.outlet}<div className="muted small">{l.hardwareId}</div></td>
                  <td className="small">{seatsText(l)}</td>
                  <td>{date(l.expiresAt)}</td>
                  <td>{status(l)}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? "Hide key" : "Show key"}</button>
                    {open === l.id ? <div className="key" style={{ marginTop: 8, maxWidth: 360 }}>{l.key}</div> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </AreaPage>
  );
}

function AccountPage({ me }: { me: Me }) {
  const { reload } = useSession();
  const [products, setProducts] = useState<ProductCode[]>(me.account.products);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const canEdit = me.user.role !== "billing";
  const saveProducts = async () => {
    try { await account.setProducts(products); await reload(); setMsg({ kind: "ok", text: "Saved." }); } catch (e) { setMsg({ kind: "error", text: e instanceof ApiError ? e.message : "Could not save." }); }
  };
  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) { setPwMsg({ kind: "error", text: "The new password needs at least 8 characters." }); return; }
    try { await account.changePassword(pw.current, pw.next); setPw({ current: "", next: "" }); setPwMsg({ kind: "ok", text: "Password changed. Other sign-ins were ended." }); } catch (err) { setPwMsg({ kind: "error", text: err instanceof ApiError ? err.message : "Could not change it." }); }
  };
  return (
    <AreaPage title="My account">
      <div className="stack">
        <div className="card pad stack">
          <h2 style={{ fontSize: 22 }}>Business</h2>
          <div className="grid-2 small">
            <div><span className="muted">Business</span><div><b>{me.account.name}</b></div></div>
            <div><span className="muted">Mobile</span><div><b>{me.account.phone}</b></div></div>
            <div><span className="muted">Signed in as</span><div><b>{me.user.name}</b> · {me.user.email}</div></div>
            <div><span className="muted">Customer since</span><div><b>{date(me.account.createdAt)}</b></div></div>
          </div>
        </div>
        <div className="card pad stack">
          <h2 style={{ fontSize: 22 }}>Products</h2>
          <p className="muted small">Downloads, add-ons and help are shown for these.</p>
          {msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : null}
          <div className="choice-grid">
            {PRODUCT_ORDER.map((code) => (
              <button key={code} type="button" className="choice" aria-pressed={products.includes(code)} disabled={!canEdit} onClick={() => setProducts(toggleProduct(products, code))}>
                <span className="tick" aria-hidden>{products.includes(code) ? "✓" : null}</span>
                <b>{productCopy(code).name}</b><small>{productCopy(code).app} · {productCopy(code).addon.name}</small>
              </button>
            ))}
          </div>
          <div><button className="btn btn-primary" disabled={!canEdit || products.length === 0} onClick={() => void saveProducts()}>Save products</button></div>
        </div>
        <form className="card pad stack" onSubmit={(e) => void changePw(e)}>
          <h2 style={{ fontSize: 22 }}>Password</h2>
          {pwMsg ? <Notice kind={pwMsg.kind}>{pwMsg.text}</Notice> : null}
          <div className="grid-2">
            <label className="field"><span>Current password</span><input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
            <label className="field"><span>New password</span><input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
          </div>
          <div><button className="btn">Change password</button></div>
        </form>
        <SignedInDevices />
      </div>
    </AreaPage>
  );
}

/** Sign-ins last until 400 days without a visit, so the person can see and end them. */
function SignedInDevices() {
  const [list, setList] = useState<SignIn[] | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const load = () => account.sessions().then((r) => setList(r.sessions)).catch(() => setMsg({ kind: "error", text: "Could not load your devices." }));
  useEffect(() => { void load(); }, []);
  const act = async (f: () => Promise<unknown>, ok: string) => {
    try { await f(); setMsg({ kind: "ok", text: ok }); await load(); } catch (e) { setMsg({ kind: "error", text: e instanceof ApiError ? e.message : "Could not do that." }); }
  };
  const others = (list ?? []).filter((s) => !s.current).length;
  return (
    <div className="card pad stack">
      <h2 style={{ fontSize: 22 }}>Signed-in devices</h2>
      <p className="muted small">You stay signed in on each device until you sign out there or here, change your password, or do not visit for 400 days. If you see a device you do not know, sign it out and change your password.</p>
      {msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : null}
      {list === null ? <p className="muted small">Loading…</p> : (
        <ul className="devices">
          {list.map((s) => (
            <li key={s.id}>
              <div>
                <b>{deviceName(s.userAgent)}</b>{s.current ? <span className="pill pill-ok" style={{ marginLeft: 8 }}>This device</span> : null}
                <div className="muted small">Last used {date(s.lastUsedAt)} · signed in {date(s.createdAt)}</div>
              </div>
              {s.current ? null : <button className="btn btn-ghost" onClick={() => void act(() => account.revokeSession(s.id), "That device is signed out.")}>Sign out</button>}
            </li>
          ))}
        </ul>
      )}
      {others > 0 ? <div><button className="btn" onClick={() => void act(() => account.revokeOtherSessions(), "All other devices are signed out.")}>Sign out all other devices</button></div> : null}
    </div>
  );
}

function PlansPage() {
  return (
    <AreaPage title="Plans and billing">
      <p className="muted" style={{ marginBottom: 16 }}>After your {TRIAL_DAYS}-day trial you keep the Free plan: every feature on one PC, at no cost, renewed by itself. Paid plans add more PCs, setup and training, and support. Prices are per outlet, per year, plus GST.</p>
      <div className="plans">
        <section className="card plan">
          <div className="row"><h2>{FREE_PLAN.name}</h2><span className="pill pill-ok">Free forever</span></div>
          <p className="muted small">{FREE_PLAN.about}</p>
          <p className="plan-price">{rupees(0)}<span className="muted small"> / outlet / year</span></p>
          <ul className="ticks">{FREE_PLAN.features.map((f) => <li key={f}><Check size={16} aria-hidden />{f}</li>)}</ul>
          <Link to="/app/downloads" className="btn btn-block">Download the app</Link>
        </section>
        {PLANS.map((p, i) => (
          <section key={p.code} className={`card plan${p.popular ? " plan-popular" : ""}`}>
            <div className="row"><h2>{p.name}</h2>{p.popular ? <span className="pill pill-primary">Most popular</span> : null}</div>
            <p className="muted small">{p.about}</p>
            <p className="plan-price">{rupees(p.price)}<span className="muted small"> / outlet / year + GST</span></p>
            <ul className="ticks">
              <li><Check size={16} aria-hidden /><b>Everything in {i > 0 ? PLANS[i - 1]!.name : FREE_PLAN.name}</b></li>
              {p.features.map((f) => <li key={f}><Check size={16} aria-hidden />{f}</li>)}
            </ul>
            <Link to={`/app/support/new?plan=${p.code}`} className={`btn btn-block${p.popular ? " btn-primary" : ""}`}>Choose {p.name}</Link>
          </section>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 16 }}>More than one outlet, or need something else? <Link to="/app/support/new">Submit a ticket</Link> and tell us how many outlets and PCs.</p>
    </AreaPage>
  );
}
