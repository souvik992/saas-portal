import { CalendarDays, Clock, Download as DownloadIcon, IndianRupee, MonitorSmartphone, ReceiptText, RefreshCw, ShoppingCart, Store, TrendingDown, TrendingUp, Trophy, UtensilsCrossed, Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { analytics as loadAnalytics, ApiError, type Analytics, type Me } from "../api";
import { ago, axis, change, count, csv, dayLabel, heatLevel, hourLabel, label, PRESETS, presetRange, qty, rangeLabel, rupees, rupeesShort, share, todayIST, type PresetId } from "../analytics";
import { Notice } from "../components/Layout";
import { Link } from "../router";

/**
 * Sales analytics for the account's outlets (PosiNext Cloud: hub/src/analytics.ts). Filters on top (dates, brand,
 * outlet, terminal); every figure below follows them. Sales are bill totals, taxes included.
 * Colours: one blue for amounts (lines, bars, the heatmap light → dark); order types use three fixed colours and
 * always carry their name and figure beside them.
 */

const TYPE_COLOR: Record<string, string> = { dine_in: "var(--viz-1)", takeaway: "var(--viz-2)", delivery: "var(--viz-3)", counter: "var(--viz-4)", "": "var(--viz-none)" };
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first

export function Delta({ now, before, days, quiet = "No sales" }: { now: number; before: number; days: number; quiet?: string }) {
  const c = change(now, before);
  const than = days === 1 ? "the day before" : `the ${days} days before`;
  if (c === null) return <span className="an-delta muted">{quiet} in {than}</span>;
  const up = c >= 0;
  return (
    <span className="an-delta">
      <span className={up ? "an-up" : "an-down"}>{up ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}{up ? "+" : "−"}{Math.abs(c)}%</span>
      <span className="muted"> vs {than}</span>
    </span>
  );
}

export function Kpi({ icon, title, value, children }: { icon: ReactNode; title: string; value: string; children?: ReactNode }) {
  return (
    <div className="card an-kpi">
      <span className="tile-icon">{icon}</span>
      <div style={{ minWidth: 0 }}>
        <p className="an-kpi-title">{title}</p>
        <p className="an-kpi-value" title={value}>{value}</p>
        {children}
      </div>
    </div>
  );
}

export function Panel({ icon, title, hint, actions, children, wide }: { icon: ReactNode; title: string; hint?: string; actions?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`card an-panel${wide ? " an-wide" : ""}`}>
      <header className="an-panel-head">
        <span className="an-panel-icon" aria-hidden>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}><h2>{title}</h2>{hint ? <p className="muted small">{hint}</p> : null}</div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <div className="an-empty muted small">{children}</div>;
const NeedsUpdate = ({ what }: { what: string }) => (
  <Empty>Your POS app does not send {what} yet. <Link to="/app/downloads">Install the latest version</Link> on the outlet&rsquo;s PC and new bills will show here.</Empty>
);

/** The width of an element, kept up to date (charts draw to their real size so text never stretches). */
function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Sales or orders per day: a line over a light fill, with a crosshair and a tooltip. One series, so no legend. */
export function DailyChart({ daily, metric, noun = "order", what }: { daily: Analytics["daily"]; metric: "sales" | "orders"; noun?: string; what?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 260, L = 52, R = 12, T = 12, B = 28;
  const values = daily.map((d) => d[metric]);
  const { max, ticks } = axis(Math.max(0, ...values));
  const n = daily.length, innerW = Math.max(10, width - L - R), innerH = H - T - B;
  const x = (i: number) => L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => T + innerH - (Math.max(0, v) / max) * innerH;
  const fmt = (v: number) => (metric === "sales" ? rupees(v) : `${count(v)} ${noun}${v === 1 ? "" : "s"}`);
  const path = daily.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[metric]).toFixed(1)}`).join(" ");
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 70))));
  const move = (clientX: number, box: DOMRect) => setHover(Math.min(n - 1, Math.max(0, Math.round(((clientX - box.left - L) / innerW) * (n - 1)))));
  const h = hover !== null ? daily[hover] : undefined;
  return (
    <div ref={ref} className="an-chart" style={{ height: H }}>
      {width > 0 ? (
        <svg width={width} height={H} role="img" aria-label={`${what ?? (metric === "sales" ? "Sales" : "Orders")} per day, ${rangeLabel(daily[0]!.date, daily[n - 1]!.date)}`}
          onMouseMove={(e) => move(e.clientX, e.currentTarget.getBoundingClientRect())} onMouseLeave={() => setHover(null)}
          onTouchStart={(e) => move(e.touches[0]!.clientX, e.currentTarget.getBoundingClientRect())} onTouchMove={(e) => move(e.touches[0]!.clientX, e.currentTarget.getBoundingClientRect())}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={width - R} y1={y(t)} y2={y(t)} className="an-grid" />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" className="an-axis">{metric === "sales" ? rupeesShort(t) : count(t)}</text>
            </g>
          ))}
          {daily.map((d, i) => (i % every === 0 ? <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle"} className="an-axis">{dayLabel(d.date)}</text> : null))}
          {n > 1 ? <path d={`${path} L${x(n - 1).toFixed(1)},${T + innerH} L${x(0).toFixed(1)},${T + innerH} Z`} className="an-area" /> : null}
          {n > 1 ? <path d={path} className="an-line" /> : null}
          {n <= 31 ? daily.map((d, i) => <circle key={d.date} cx={x(i)} cy={y(d[metric])} r={n === 1 ? 5 : 3} className="an-dot" />) : null}
          {h ? <><line x1={x(hover!)} x2={x(hover!)} y1={T} y2={T + innerH} className="an-cross" /><circle cx={x(hover!)} cy={y(h[metric])} r={5} className="an-dot an-dot-on" /></> : null}
        </svg>
      ) : null}
      {h ? (
        <div className="an-tip" style={{ left: Math.min(Math.max(x(hover!), 80), width - 80), top: Math.max(0, y(h[metric]) - 64) }} role="status">
          <b>{fmt(h[metric])}</b>
          <span>{dayLabel(h.date, true)}</span>
          <span>{metric === "sales" ? `${count(h.orders)} ${noun}${h.orders === 1 ? "" : "s"}` : rupees(h.sales)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Orders by weekday and hour: one blue, light (quiet) to dark (busy). Every cell says its figure on hover or focus. */
function PeakHours({ hours }: { hours: Analytics["hours"] }) {
  const byCell = new Map(hours.map((c) => [`${c.dow}-${c.hour}`, c]));
  const used = hours.map((c) => c.hour);
  const first = Math.min(...used), last = Math.max(...used);
  const cols = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const max = Math.max(...hours.map((c) => c.orders));
  const busiest = hours.reduce((a, b) => (b.orders > a.orders ? b : a));
  return (
    <>
      <div className="an-heat-scroll">
        <div className="an-heat" style={{ gridTemplateColumns: `40px repeat(${cols.length}, minmax(22px, 1fr))` }} role="table" aria-label="Orders by weekday and hour">
          <span />
          {cols.map((hr) => <span key={hr} className="an-heat-col">{cols.length <= 10 || (hr - first) % 2 === 0 ? hourLabel(hr) : ""}</span>)}
          {WEEK.map((dow) => (
            <div key={dow} role="row" style={{ display: "contents" }}>
              <span className="an-heat-row" role="rowheader">{DOW[dow]}</span>
              {cols.map((hr) => {
                const c = byCell.get(`${dow}-${hr}`);
                const tip = `${DOW[dow]} ${hourLabel(hr)}–${hourLabel((hr + 1) % 24)}: ${c ? `${count(c.orders)} order${c.orders === 1 ? "" : "s"}, ${rupees(c.sales)}` : "no orders"}`;
                return <span key={hr} role="cell" tabIndex={0} className={`an-cell an-heat-${heatLevel(c?.orders ?? 0, max)}`} data-tip={tip} aria-label={tip} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="an-heat-foot small">
        <span>Busiest: <b>{DOW[busiest.dow]} {hourLabel(busiest.hour)}–{hourLabel((busiest.hour + 1) % 24)}</b> ({count(busiest.orders)} orders)</span>
        <span className="an-heat-key muted" aria-hidden>Fewer {[1, 2, 3, 4, 5].map((l) => <i key={l} className={`an-heat-${l}`} />)} More</span>
      </div>
    </>
  );
}

/** A list of names with a bar and a figure each: the bar compares, the figure tells. */
export function BarList({ rows }: { rows: Array<{ key: string; name: string; note?: string | undefined; value: number; figure: string; aside?: string | undefined }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="an-bars">
      {rows.map((r, i) => (
        <li key={r.key}>
          <span className="an-rank" aria-hidden>{i + 1}</span>
          <div className="an-bar-body">
            <div className="an-bar-top"><span className="an-bar-name" title={r.name}>{r.name}{r.note ? <span className="muted"> · {r.note}</span> : null}</span><span className="an-bar-fig"><b>{r.figure}</b>{r.aside ? <span className="muted"> {r.aside}</span> : null}</span></div>
            <div className="an-track"><span style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} /></div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Dine-in, takeaway and delivery as parts of one bar, each named with its share and orders below. */
function OrderTypes({ types }: { types: Analytics["orderTypes"] }) {
  const total = types.reduce((s, t) => s + t.orders, 0);
  return (
    <>
      <div className="an-split" role="img" aria-label={types.map((t) => `${label(t.type)} ${share(t.orders, total)}%`).join(", ")}>
        {types.map((t) => <span key={t.type} style={{ flexGrow: t.orders, background: TYPE_COLOR[t.type] ?? "var(--viz-none)" }} />)}
      </div>
      <ul className="an-legend">
        {types.map((t) => (
          <li key={t.type}>
            <i style={{ background: TYPE_COLOR[t.type] ?? "var(--viz-none)" }} aria-hidden />
            <span className="an-legend-name">{label(t.type)}</span>
            <b>{share(t.orders, total)}%</b>
            <span className="muted">{count(t.orders)} order{t.orders === 1 ? "" : "s"} · {rupees(t.sales)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function AnalyticsPage({ me }: { me: Me }) {
  const [preset, setPreset] = useState<PresetId>("30d");
  const [custom, setCustom] = useState(() => presetRange("30d", todayIST()));
  const [brand, setBrand] = useState("");
  const [store, setStore] = useState("");
  const [terminal, setTerminal] = useState("");
  const [metric, setMetric] = useState<"sales" | "orders">("sales");
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [tick, setTick] = useState(0);

  const range = useMemo(() => (preset === "custom" ? custom : presetRange(preset, todayIST())), [preset, custom, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const valid = range.from <= range.to;
  useEffect(() => {
    if (!valid) return;
    let live = true;
    setBusy(true);
    loadAnalytics({ ...range, brand, store, terminal }).then(
      (d) => { if (live) { setData(d); setError(null); setBusy(false); } },
      (e: unknown) => { if (live) { setError(e instanceof ApiError ? e.message : "Could not load your sales."); setBusy(false); } },
    );
    return () => { live = false; };
  }, [range, brand, store, terminal, valid]);
  // a page left open keeps itself fresh (the cloud keeps each answer for 30 seconds, so this is cheap)
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") setTick((n) => n + 1); }, 120_000);
    return () => clearInterval(t);
  }, []);

  const f = data?.filters;
  const stores = (f?.stores ?? []).filter((s) => !brand || s.brand === brand);
  const terminals = (f?.terminals ?? []).filter((t) => t.store === store);
  const pickBrand = (v: string) => { setBrand(v); setStore(""); setTerminal(""); };
  const pickStore = (v: string) => { setStore(v); setTerminal(""); };

  const head = (
    <div className="area-head">
      <div>
        <div className="crumbs"><Link to="/app">Client area</Link> › Analytics</div>
        <h1>Analytics</h1>
        <p className="muted" style={{ marginTop: 6 }}>How {me.account.name} is selling, across your outlets.</p>
      </div>
    </div>
  );

  if (data && data.filters.stores.length === 0) {
    return (
      <div className="wrap area">{head}
        <div className="card pad stack">
          <h2 style={{ fontSize: 22 }}>No outlet is sending sales yet</h2>
          <p className="muted">Analytics fills in by itself once the POS on your outlet&rsquo;s PC is signed in to this account and connected to the internet.</p>
          <ol className="stack" style={{ margin: 0, paddingLeft: 20, gap: 8 }}>
            <li><Link to="/app/downloads">Download</Link> the latest POS app and install it on the outlet&rsquo;s main PC.</li>
            <li>In the app, sign in with this account (Settings › Licence).</li>
            <li>Bill as usual. Sales reach this page within a minute; bills made offline arrive when the internet is back.</li>
          </ol>
          <p className="muted small">Already billing and still nothing here? <Link to="/app/support/new">Submit a ticket</Link> and we will link your outlet.</p>
        </div>
      </div>
    );
  }

  const t = data?.totals, p = data?.previousTotals, days = data?.range.days ?? 1;
  const top = data?.topItems[0];
  const bestDay = data?.daily.reduce((a, b) => (b.sales > a.sales ? b : a), data.daily[0]!);
  const stale = (data?.outlets ?? []).filter((o) => o.lastSyncAt !== null && Date.now() - o.lastSyncAt > 36 * 3_600_000);
  const never = (data?.outlets ?? []).filter((o) => o.lastSyncAt === null);
  const exportCsv = () => {
    if (!data) return;
    download(`sales-${data.range.from}-to-${data.range.to}.csv`, csv([["Date", "Sales (Rs)", "Orders"], ...data.daily.map((d) => [d.date, (d.sales / 100).toFixed(2), d.orders])]));
  };

  return (
    <div className="wrap area an">
      {head}

      <div className="card an-filters" aria-busy={busy}>
        <label className="an-filter"><span><CalendarDays size={14} aria-hidden /> Dates</span>
          <select className="input select" value={preset} onChange={(e) => { if (e.target.value === "custom") setCustom(range); setPreset(e.target.value as PresetId); }}>
            {PRESETS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
        {preset === "custom" ? (
          <>
            <label className="an-filter"><span>From</span><input className="input" type="date" value={custom.from} max={todayIST()} onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })} /></label>
            <label className="an-filter"><span>To</span><input className="input" type="date" value={custom.to} min={custom.from} max={todayIST()} onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })} /></label>
          </>
        ) : null}
        {f && f.brands.length > 0 ? (
          <label className="an-filter"><span>Brand</span>
            <select className="input select" value={brand} onChange={(e) => pickBrand(e.target.value)}>
              <option value="">All brands</option>
              {f.brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
          </label>
        ) : null}
        {f && f.stores.length > 1 ? (
          <label className="an-filter"><span><Store size={14} aria-hidden /> Outlet</span>
            <select className="input select" value={store} onChange={(e) => pickStore(e.target.value)}>
              <option value="">All outlets ({stores.length})</option>
              {stores.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </label>
        ) : null}
        {(store || (f && f.stores.length === 1)) && (f?.terminals ?? []).filter((x) => x.store === (store || f!.stores[0]!.slug)).length > 1 ? (
          <label className="an-filter"><span><MonitorSmartphone size={14} aria-hidden /> Terminal</span>
            <select className="input select" value={terminal} onChange={(e) => setTerminal(e.target.value)}>
              <option value="">All terminals</option>
              {(store ? terminals : f!.terminals).map((x) => <option key={x.name} value={x.name}>{x.name}</option>)}
            </select>
          </label>
        ) : null}
        <span className="spacer" />
        <div className="an-fresh small muted">
          {data ? <span>{rangeLabel(data.range.from, data.range.to)}{data.lastSyncAt ? <> · last sale received {ago(data.lastSyncAt)}</> : null}</span> : null}
          <button className="btn btn-ghost an-icon-btn" onClick={() => setTick((n) => n + 1)} aria-label="Refresh" title="Refresh"><RefreshCw size={16} className={busy ? "an-spin" : ""} /></button>
        </div>
      </div>

      {!valid ? <Notice>The start date is after the end date.</Notice> : <Notice>{error}</Notice>}
      {stale.length + never.length > 0 && data ? (
        <Notice kind="info">
          {stale.length > 0 ? <>No sales received for over a day from: <b>{stale.map((o) => o.name).join(", ")}</b> (last {stale.map((o) => ago(o.lastSyncAt!)).join(", ")}). If the outlet was open, check its internet connection; its bills will arrive when it is back. </> : null}
          {never.length > 0 ? <>Not sending sales yet: <b>{never.map((o) => o.name).join(", ")}</b>.</> : null}
        </Notice>
      ) : null}

      {!data && !error ? <div className="card empty" aria-busy="true">Loading your sales…</div> : null}
      {data && t && p ? (
        <>
          <div className="an-kpis">
            <Kpi icon={<IndianRupee size={20} />} title="Total sales" value={rupees(t.sales)}><Delta now={t.sales} before={p.sales} days={days} /></Kpi>
            <Kpi icon={<ShoppingCart size={20} />} title="Orders" value={count(t.orders)}><Delta now={t.orders} before={p.orders} days={days} /></Kpi>
            <Kpi icon={<ReceiptText size={20} />} title="Average bill" value={rupees(t.avgTicket)}><Delta now={t.avgTicket} before={p.avgTicket} days={days} /></Kpi>
            {top ? (
              <Kpi icon={<Trophy size={20} />} title="Top selling item" value={top.name}><span className="an-delta muted">{qty(top.qtyMilli)} sold ({share(top.qtyMilli, data.itemTotals.qtyMilli)}% of all items)</span></Kpi>
            ) : (
              <Kpi icon={<Trophy size={20} />} title="Best day" value={bestDay && bestDay.sales > 0 ? dayLabel(bestDay.date) : "—"}><span className="an-delta muted">{bestDay && bestDay.sales > 0 ? `${rupees(bestDay.sales)} from ${count(bestDay.orders)} orders` : "No sales in these dates"}</span></Kpi>
            )}
          </div>

          {t.orders === 0 && t.voids === 0 && t.refunds === 0 ? (
            <div className="card empty">No sales in these dates{store || brand || terminal ? " for this choice" : ""}. Try other dates{store || brand ? " or all outlets" : ""}.</div>
          ) : (
            <div className="an-grid-2">
              <Panel wide icon={<TrendingUp size={18} />} title={metric === "sales" ? "Daily sales" : "Daily orders"} hint="Bill totals for each business day, taxes included"
                actions={<div className="row" style={{ gap: 8 }}>
                  <select className="input select an-small" value={metric} onChange={(e) => setMetric(e.target.value as "sales" | "orders")} aria-label="Show"><option value="sales">Sales</option><option value="orders">Orders</option></select>
                  <button className="btn an-small" onClick={exportCsv}><DownloadIcon size={15} aria-hidden /> CSV</button>
                </div>}>
                <DailyChart daily={data.daily} metric={metric} />
              </Panel>

              <Panel icon={<Clock size={18} />} title="Peak hours" hint="Orders by weekday and hour of billing">
                {data.hours.length > 0 ? <PeakHours hours={data.hours} /> : <Empty>No orders in these dates.</Empty>}
              </Panel>

              <Panel icon={<UtensilsCrossed size={18} />} title="Top selling items" hint="By quantity sold">
                {data.topItems.length > 0
                  ? <BarList rows={data.topItems.map((i) => ({ key: i.name, name: i.name, note: i.category || undefined, value: i.qtyMilli, figure: `${qty(i.qtyMilli)} sold`, aside: `· ${rupees(i.amount)}` }))} />
                  : <NeedsUpdate what="the items on each bill" />}
              </Panel>

              <Panel icon={<ShoppingCart size={18} />} title="Order types" hint="Counter, dine-in, takeaway and delivery">
                {data.recorded.orderTypes ? <OrderTypes types={data.orderTypes} /> : <NeedsUpdate what="the order type" />}
                {data.channels.some((c) => c.channel !== "" && c.channel !== "pos") ? (
                  <>
                    <h3 className="an-sub">Where orders came from</h3>
                    <BarList rows={data.channels.map((c) => ({ key: c.channel, name: label(c.channel), value: c.sales, figure: rupees(c.sales), aside: `· ${count(c.orders)} orders` }))} />
                  </>
                ) : null}
              </Panel>

              <Panel icon={<Wallet size={18} />} title="How guests paid" hint="Money received by payment mode">
                {data.payments.length > 0
                  ? <BarList rows={data.payments.map((m) => ({ key: m.mode, name: label(m.mode), value: Math.max(0, m.amount), figure: rupees(m.amount), aside: `· ${share(m.amount, data.payments.reduce((s, x) => s + x.amount, 0))}%` }))} />
                  : <Empty>No payments recorded in these dates.</Empty>}
                <dl className="an-facts">
                  <div><dt>Discounts given</dt><dd>{rupees(t.discount)}</dd></div>
                  <div><dt>Tax collected</dt><dd>{rupees(t.tax)}</dd></div>
                  <div><dt>Cancelled bills</dt><dd>{count(t.voids)}{t.voids > 0 ? <span className="muted"> · {rupees(t.voidAmount)}</span> : null}</dd></div>
                  <div><dt>Refunds</dt><dd>{count(t.refunds)}{t.refunds > 0 ? <span className="muted"> · {rupees(t.refundAmount)}</span> : null}</dd></div>
                  {t.covers > 0 ? <div><dt>Guests served</dt><dd>{count(t.covers)}</dd></div> : null}
                </dl>
              </Panel>

              {data.categories.length > 0 ? (
                <Panel icon={<UtensilsCrossed size={18} />} title="Menu categories" hint="By sales">
                  <BarList rows={data.categories.map((c) => ({ key: c.name, name: c.name, value: c.amount, figure: rupees(c.amount), aside: `· ${share(c.amount, data.itemTotals.amount)}%` }))} />
                </Panel>
              ) : null}

              {data.outlets.length > 1 ? (
                <Panel wide icon={<Store size={18} />} title="Outlets" hint="Each outlet in these dates, best first. Click an outlet to see only its figures.">
                  <div className="table-wrap">
                    <table className="table an-table">
                      <thead><tr><th>Outlet</th><th className="num">Sales</th><th className="num">Orders</th><th className="num">Average bill</th><th className="num">Change</th><th>Last sale received</th></tr></thead>
                      <tbody>
                        {data.outlets.map((o) => {
                          const c = change(o.sales, o.previousSales);
                          return (
                            <tr key={o.slug}>
                              <td><button className="an-link" onClick={() => pickStore(o.slug)}>{o.name}</button>{o.brandName ? <div className="muted small">{o.brandName}</div> : null}</td>
                              <td className="num"><b>{rupees(o.sales)}</b><div className="an-track an-track-cell"><span style={{ width: `${share(o.sales, Math.max(1, data.outlets[0]!.sales))}%` }} /></div></td>
                              <td className="num">{count(o.orders)}</td>
                              <td className="num">{rupees(o.avgTicket)}</td>
                              <td className="num">{c === null ? <span className="muted">—</span> : <span className={c >= 0 ? "an-up" : "an-down"}>{c >= 0 ? "+" : "−"}{Math.abs(c)}%</span>}</td>
                              <td className="small">{o.lastSyncAt ? ago(o.lastSyncAt) : <span className="muted">Not sending yet</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              ) : null}

              {data.terminals.length > 0 ? (
                <Panel wide icon={<MonitorSmartphone size={18} />} title="Terminals" hint="Billing counters and devices in these outlets">
                  <div className="table-wrap">
                    <table className="table an-table">
                      <thead><tr><th>Terminal</th><th>Outlet</th><th className="num">Sales</th><th className="num">Orders</th><th className="num">Average bill</th></tr></thead>
                      <tbody>
                        {data.terminals.map((x) => (
                          <tr key={`${x.store}/${x.name}`}>
                            <td><b>{x.name}</b></td><td>{x.storeName}</td>
                            <td className="num"><b>{rupees(x.sales)}</b><div className="an-track an-track-cell"><span style={{ width: `${share(x.sales, Math.max(1, data.terminals[0]!.sales))}%` }} /></div></td>
                            <td className="num">{count(x.orders)}</td><td className="num">{rupees(x.avgTicket)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              ) : null}
            </div>
          )}
          <p className="muted small" style={{ marginTop: 16 }}>Sales are bill totals with taxes, for business days in India time. Cancelled bills are left out; refunds are taken off. Compared with {rangeLabel(data.previous.from, data.previous.to)}.</p>
        </>
      ) : null}
    </div>
  );
}
