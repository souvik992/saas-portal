import { CheckCircle2, CircleAlert, CircleX } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ApiError, support, type Announcement, type Article, type ProductCode, type Status, type Ticket } from "../api";
import { Notice } from "../components/Layout";
import { PRODUCT_COPY, PRODUCT_ORDER } from "../products";
import { Link, navigate, useLocation } from "../router";
import { useSession } from "../session";

const when = (t: number) => new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const day = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

/** Plain text from the admin page: blank lines make paragraphs. */
function Prose({ text }: { text: string }) {
  return <div className="stack" style={{ gap: 10 }}>{text.split(/\n{2,}/).map((p, i) => <p key={i} style={{ whiteSpace: "pre-wrap" }}>{p}</p>)}</div>;
}

function useLoad<T>(load: () => Promise<T>, key: string): { data: T | null; error: string | null; setData: (d: T) => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setData(null); setError(null);
    load().then((d) => { if (live) setData(d); }, (e: unknown) => { if (live) setError(message(e)); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { data, error, setData };
}

const STATUS: Record<Ticket["status"], { label: string; cls: string }> = {
  open: { label: "Waiting for us", cls: "pill-warn" },
  answered: { label: "Answered", cls: "pill-ok" },
  closed: { label: "Closed", cls: "" },
};

export function SupportTickets({ compose = false, ticketId }: { compose?: boolean; ticketId?: string }) {
  if (compose) return <NewTicket />;
  if (ticketId) return <TicketView id={ticketId} />;
  return <TicketList />;
}

function TicketList() {
  const { data, error } = useLoad(() => support.tickets(), "list");
  return (
    <div className="stack">
      <div className="row"><span className="muted">Questions, problems and plan requests. We answer by email and here.</span><span className="spacer" /><Link to="/app/support/new" className="btn btn-primary">Submit a ticket</Link></div>
      <Notice>{error}</Notice>
      <div className="card table-wrap">
        {data && data.tickets.length === 0 ? <div className="empty">No tickets yet.</div> : null}
        {!data && !error ? <div className="empty">Loading…</div> : null}
        {data && data.tickets.length > 0 ? (
          <table className="table">
            <thead><tr><th>#</th><th>Subject</th><th>Product</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {data.tickets.map((t) => (
                <tr key={t.id}>
                  <td>#{t.number}</td>
                  <td><Link to={`/app/support/${t.id}`}>{t.subject}</Link></td>
                  <td>{t.product ? PRODUCT_COPY[t.product].name : "—"}</td>
                  <td><span className={`pill ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span></td>
                  <td className="muted small">{when(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

function NewTicket() {
  const { me } = useSession();
  const [subject, setSubject] = useState("");
  const [product, setProduct] = useState<ProductCode | "">(me?.account.products.length === 1 ? me.account.products[0]! : "");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { setError("Enter a subject and your message."); return; }
    setBusy(true); setError(null);
    try { const t = await support.open({ subject: subject.trim(), product: product || null, body: body.trim() }); navigate(`/app/support/${t.id}`); }
    catch (err) { setError(message(err)); } finally { setBusy(false); }
  };
  return (
    <form className="card pad stack" onSubmit={(e) => void submit(e)} noValidate>
      <Notice>{error}</Notice>
      <div className="grid-2">
        <label className="field"><span>Subject</span><input className="input" value={subject} maxLength={120} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. The kitchen printer does not print" /></label>
        <label className="field"><span>Product</span>
          <select className="input" value={product} onChange={(e) => setProduct(e.target.value as ProductCode | "")}>
            <option value="">Both / not about one product</option>
            {PRODUCT_ORDER.map((p) => <option key={p} value={p}>{PRODUCT_COPY[p].name} ({PRODUCT_COPY[p].app})</option>)}
          </select>
        </label>
      </div>
      <label className="field"><span>Message</span><textarea className="input" rows={7} value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)} placeholder="What happened, on which PC, and what you expected. For a plan, tell us how many outlets and PCs." /></label>
      <div className="row"><button className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Submit ticket"}</button><Link to="/app/support" className="btn btn-ghost">Cancel</Link></div>
    </form>
  );
}

function TicketView({ id }: { id: string }) {
  const { data, error, setData } = useLoad(() => support.ticket(id), id);
  const [reply, setReply] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<Ticket>) => {
    setBusy(true); setErr(null);
    try { setData(await fn()); setReply(""); } catch (e) { setErr(message(e)); } finally { setBusy(false); }
  };
  if (error) return <Notice>{error}</Notice>;
  if (!data) return <div className="empty">Loading…</div>;
  return (
    <div className="stack">
      <div className="row">
        <h2 style={{ fontSize: 24 }}>#{data.number} {data.subject}</h2>
        <span className={`pill ${STATUS[data.status].cls}`}>{STATUS[data.status].label}</span>
        <span className="spacer" />
        <Link to="/app/support" className="btn btn-ghost">All tickets</Link>
      </div>
      {(data.messages ?? []).map((m) => (
        <div key={m.id} className="card pad" style={m.from === "staff" ? { background: "var(--primary-soft)", borderColor: "transparent" } : undefined}>
          <div className="muted small" style={{ marginBottom: 8 }}><b style={{ color: "var(--foreground)" }}>{m.from === "staff" ? `${m.name} · support` : m.name}</b> · {when(m.at)}</div>
          <Prose text={m.body} />
        </div>
      ))}
      <form className="card pad stack" onSubmit={(e) => { e.preventDefault(); if (reply.trim()) void run(() => support.reply(id, reply.trim())); }}>
        <Notice>{err}</Notice>
        <label className="field"><span>{data.status === "closed" ? "Reply (opens the ticket again)" : "Reply"}</span><textarea className="input" rows={4} value={reply} maxLength={5000} onChange={(e) => setReply(e.target.value)} /></label>
        <div className="row">
          <button className="btn btn-primary" disabled={busy || !reply.trim()}>Send reply</button>
          {data.status !== "closed" ? <button type="button" className="btn" disabled={busy} onClick={() => void run(() => support.close(id))}>Close ticket</button> : null}
        </div>
      </form>
    </div>
  );
}

export function Announcements() {
  const { me } = useSession();
  const { data, error } = useLoad(() => support.announcements(), "a");
  const mine = (data?.announcements ?? []).filter((a: Announcement) => !a.product || me?.account.products.includes(a.product));
  return (
    <div className="stack">
      <Notice>{error}</Notice>
      {data && mine.length === 0 ? <div className="card empty">No announcements yet.</div> : null}
      {mine.map((a) => (
        <article key={a.id} className="card pad stack" style={{ gap: 10 }}>
          <div className="row"><h2 style={{ fontSize: 22 }}>{a.title}</h2>{a.product ? <span className="pill pill-primary">{PRODUCT_COPY[a.product].name}</span> : null}<span className="spacer" /><span className="muted small">{day(a.publishedAt)}</span></div>
          <Prose text={a.body} />
        </article>
      ))}
    </div>
  );
}

export function KnowledgeBase() {
  const { query } = useLocation();
  const slug = query.get("a");
  const list = useLoad(() => support.articles(), "list");
  if (slug) return <ArticleView slug={slug} />;
  const groups = new Map<string, Array<Omit<Article, "body">>>();
  for (const a of list.data?.articles ?? []) groups.set(a.category, [...(groups.get(a.category) ?? []), a]);
  return (
    <div className="stack">
      <Notice>{list.error}</Notice>
      {list.data && groups.size === 0 ? <div className="card empty">No articles yet. Ask us in a <Link to="/app/support/new">ticket</Link>.</div> : null}
      <div className="products">
        {[...groups].map(([cat, items]) => (
          <div key={cat} className="card pad stack" style={{ gap: 10 }}>
            <h2 style={{ fontSize: 20 }}>{cat}</h2>
            {items.map((a) => <Link key={a.slug} to={`/app/kb?a=${encodeURIComponent(a.slug)}`}>{a.title}</Link>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleView({ slug }: { slug: string }) {
  const { data, error } = useLoad(() => support.article(slug), slug);
  if (error) return <Notice>{error}</Notice>;
  if (!data) return <div className="empty">Loading…</div>;
  return (
    <article className="card pad stack">
      <Link to="/app/kb">← All articles</Link>
      <h2 style={{ fontSize: 28 }}>{data.title}</h2>
      <div className="muted small">{data.category}{data.product ? ` · ${PRODUCT_COPY[data.product].name}` : ""} · updated {day(data.updatedAt)}</div>
      <Prose text={data.body} />
    </article>
  );
}

const STATUS_ICON: Record<Status["components"][number]["status"], ReactNode> = {
  ok: <CheckCircle2 size={20} color="var(--ok)" />,
  degraded: <CircleAlert size={20} color="var(--warn)" />,
  down: <CircleX size={20} color="var(--danger)" />,
};

export function ServiceStatus() {
  const { data, error } = useLoad(() => support.status(), "s");
  return (
    <div className="stack">
      <Notice>{error ? "The status could not be loaded: the service may be down. Please try again in a few minutes." : null}</Notice>
      {data ? (
        <>
          <div className={`notice ${data.ok ? "notice-ok" : ""}`}>{data.ok ? "Everything is running." : "Some parts need attention."} Checked {when(data.checkedAt)}.</div>
          <div className="card">
            {data.components.map((c) => (
              <div key={c.name} className="download">{STATUS_ICON[c.status]}<div style={{ flex: 1 }}><b>{c.name}</b><div className="meta">{c.note}</div></div></div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
