import { AlertTriangle, Boxes, CalendarDays, IndianRupee, PackageSearch, Percent, RefreshCw, ShoppingBasket, Store, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ApiError, inventory as loadInventory, type Inventory, type Me } from "../api";
import { ago, count, dayLabel, PRESETS, presetRange, qty, rangeLabel, rupees, share, todayIST, type PresetId } from "../analytics";
import { Notice } from "../components/Layout";
import { Link } from "../router";
import { BarList, DailyChart, Delta, Empty, Kpi, Panel } from "./Analytics";

/**
 * Purchases and stock across the account's outlets (PosiNext Cloud: hub/src/inventory.ts). View only: purchases,
 * counts and recipes are entered in the POS at each outlet. Stock figures are "as of" the last list each outlet sent;
 * purchases and food cost follow the dates chosen.
 */

const amountOf = (milli: number, unit: string) => `${qty(milli)} ${unit}`;

export function InventoryPage({ me }: { me: Me }) {
  const [preset, setPreset] = useState<PresetId>("30d");
  const [custom, setCustom] = useState(() => presetRange("30d", todayIST()));
  const [brand, setBrand] = useState("");
  const [store, setStore] = useState("");
  const [find, setFind] = useState("");
  const [data, setData] = useState<Inventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [tick, setTick] = useState(0);

  const range = useMemo(() => (preset === "custom" ? custom : presetRange(preset, todayIST())), [preset, custom, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const valid = range.from <= range.to;
  useEffect(() => {
    if (!valid) return;
    let live = true;
    setBusy(true);
    loadInventory({ ...range, brand, store }).then(
      (d) => { if (live) { setData(d); setError(null); setBusy(false); } },
      (e: unknown) => { if (live) { setError(e instanceof ApiError ? e.message : "Could not load your stock."); setBusy(false); } },
    );
    return () => { live = false; };
  }, [range, brand, store, valid]);

  const f = data?.filters;
  const stores = (f?.stores ?? []).filter((s) => !brand || s.brand === brand);
  const head = (
    <div className="area-head">
      <div>
        <div className="crumbs"><Link to="/app">Client area</Link> › Purchases &amp; stock</div>
        <h1>Purchases &amp; stock</h1>
        <p className="muted" style={{ marginTop: 6 }}>What {me.account.name} has in stock, what is running low, and what you bought.</p>
      </div>
    </div>
  );

  if (data && data.filters.stores.length === 0) {
    return (
      <div className="wrap area">{head}
        <div className="card pad stack">
          <h2 style={{ fontSize: 22 }}>No outlet is connected yet</h2>
          <p className="muted">This page fills in once the POS on your outlet&rsquo;s PC is signed in to this account. Then set up your materials and enter purchases in the POS (Stock and Purchase screens); they show here by themselves.</p>
          <div><Link to="/app/downloads" className="btn btn-primary">Go to downloads</Link></div>
        </div>
      </div>
    );
  }

  const s = data?.stock, p = data?.purchases, c = data?.cost;
  const noStock = s !== undefined && s.outlets.every((o) => o.updatedAt === null);
  const waiting = (s?.outlets ?? []).filter((o) => o.updatedAt === null);
  const list = (s?.list ?? []).filter((i) => i.name.toLowerCase().includes(find.trim().toLowerCase()));
  const foodCost = c && c.sales > 0 && c.recorded ? Math.round((c.used / c.sales) * 1000) / 10 : null;

  return (
    <div className="wrap area an">
      {head}
      <div className="card an-filters" aria-busy={busy}>
        <label className="an-filter"><span><CalendarDays size={14} aria-hidden /> Purchase dates</span>
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
            <select className="input select" value={brand} onChange={(e) => { setBrand(e.target.value); setStore(""); }}>
              <option value="">All brands</option>
              {f.brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
          </label>
        ) : null}
        {f && f.stores.length > 1 ? (
          <label className="an-filter"><span><Store size={14} aria-hidden /> Outlet</span>
            <select className="input select" value={store} onChange={(e) => { setStore(e.target.value); setFind(""); }}>
              <option value="">All outlets ({stores.length})</option>
              {stores.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}
            </select>
          </label>
        ) : null}
        <span className="spacer" />
        <div className="an-fresh small muted">
          {s?.updatedAt ? <span>Stock as of {ago(s.updatedAt)}</span> : null}
          <button className="btn btn-ghost an-icon-btn" onClick={() => setTick((n) => n + 1)} aria-label="Refresh" title="Refresh"><RefreshCw size={16} className={busy ? "an-spin" : ""} /></button>
        </div>
      </div>

      {!valid ? <Notice>The start date is after the end date.</Notice> : <Notice>{error}</Notice>}
      {data && !noStock && waiting.length > 0 ? <Notice kind="info">No stock list yet from: <b>{waiting.map((o) => o.name).join(", ")}</b>. It arrives once that outlet runs the latest POS app and has materials set up.</Notice> : null}
      {!data && !error ? <div className="card empty" aria-busy="true">Loading your stock…</div> : null}

      {data && s && p && c ? (
        <>
          <div className="an-kpis">
            <Kpi icon={<Boxes size={20} />} title="Stock value" value={noStock ? "—" : rupees(s.value)}><span className="an-delta muted">{noStock ? "No stock list received yet" : `${count(s.items)} materials, at last purchase cost`}</span></Kpi>
            <Kpi icon={<AlertTriangle size={20} />} title="Running low" value={noStock ? "—" : count(s.low)}><span className="an-delta muted">{noStock ? "—" : s.out > 0 ? `${count(s.out)} at zero or below` : "At or under the reorder level"}</span></Kpi>
            <Kpi icon={<ShoppingBasket size={20} />} title="Purchases" value={rupees(p.total)}><Delta now={p.total} before={p.previousTotal} days={data.range.days} quiet="No purchases" /></Kpi>
            <Kpi icon={<Percent size={20} />} title="Food cost" value={foodCost === null ? "—" : `${foodCost}%`}>
              <span className="an-delta muted">{foodCost === null ? (c.recorded ? "No sales in these dates" : "Needs recipes set up in the POS") : `${rupees(c.used)} used for ${rupees(c.sales)} of sales`}</span>
            </Kpi>
          </div>

          <div className="an-grid-2">
            <Panel icon={<AlertTriangle size={18} />} title="Running low" hint="Materials at or under their reorder level, most urgent first">
              {noStock ? <Empty>Your POS app does not send its stock list yet. <Link to="/app/downloads">Install the latest version</Link> on the outlet&rsquo;s PC.</Empty>
                : s.lowItems.length === 0 ? <Empty>Nothing is running low. Reorder levels are set per material in the POS (Stock screen).</Empty>
                : (
                  <div className="table-wrap an-scroll">
                    <table className="table an-table">
                      <thead><tr><th>Material</th>{s.outlets.length > 1 ? <th>Outlet</th> : null}<th className="num">In stock</th><th className="num">Reorder at</th></tr></thead>
                      <tbody>
                        {s.lowItems.map((i) => (
                          <tr key={`${i.store}/${i.name}`}>
                            <td><b>{i.name}</b></td>
                            {s.outlets.length > 1 ? <td className="small">{i.storeName}</td> : null}
                            <td className="num"><span className={`pill ${i.onHandMilli <= 0 ? "pill-danger" : "pill-warn"}`}>{amountOf(i.onHandMilli, i.unit)}</span></td>
                            <td className="num muted">{amountOf(i.reorderMilli, i.unit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </Panel>

            <Panel icon={<Truck size={18} />} title="Suppliers" hint="Who you bought from in these dates">
              {p.suppliers.length > 0
                ? <BarList rows={p.suppliers.map((x) => ({ key: x.supplier, name: x.supplier, value: x.total, figure: rupees(x.total), aside: `· ${count(x.count)} bill${x.count === 1 ? "" : "s"} · ${share(x.total, p.total)}%` }))} />
                : <Empty>No purchases in these dates. Purchases are entered in the POS (Purchase screen).</Empty>}
            </Panel>

            <Panel wide icon={<IndianRupee size={18} />} title="Purchases per day" hint={`${count(p.count)} purchase bill${p.count === 1 ? "" : "s"}, ${rangeLabel(data.range.from, data.range.to)}`}>
              {p.count > 0 ? <DailyChart daily={p.daily.map((d) => ({ date: d.date, sales: d.total, orders: d.count }))} metric="sales" noun="purchase" what="Purchases" /> : <Empty>No purchases in these dates.</Empty>}
            </Panel>

            <Panel icon={<PackageSearch size={18} />} title="Most bought materials" hint="By amount spent">
              {p.materials.length > 0
                ? <BarList rows={p.materials.map((m) => ({ key: `${m.name}/${m.unit}`, name: m.name, value: m.amount, figure: rupees(m.amount), aside: `· ${amountOf(m.qtyMilli, m.unit)}` }))} />
                : <Empty>No purchases in these dates.</Empty>}
            </Panel>

            <Panel icon={<Percent size={18} />} title="Food cost" hint="What your sales used, at each material's last purchase cost">
              {c.recorded ? (
                <dl className="an-facts" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                  <div><dt>Used by sales</dt><dd>{rupees(c.used)}</dd></div>
                  <div><dt>Sales</dt><dd>{rupees(c.sales)}</dd></div>
                  <div><dt>Food cost</dt><dd>{foodCost === null ? "—" : `${foodCost}% of sales`}</dd></div>
                  <div><dt>Wasted</dt><dd>{rupees(c.waste)}{c.used > 0 && c.waste > 0 ? <span className="muted"> · {share(c.waste, c.used + c.waste)}% of what left stock</span> : null}</dd></div>
                  <div><dt>Purchases</dt><dd>{rupees(p.total)}{c.sales > 0 ? <span className="muted"> · {share(p.total, c.sales)}% of sales</span> : null}</dd></div>
                </dl>
              ) : <Empty>Food cost needs a recipe for each dish (how much of each material one portion uses). Set recipes in the POS and this fills in from the next sale.</Empty>}
              <p className="muted small" style={{ marginTop: 12 }}>An estimate: it uses the last price you paid for each material, and only counts dishes that have a recipe.</p>
            </Panel>

            {s.outlets.length > 1 ? (
              <Panel wide icon={<Store size={18} />} title="Stock by outlet" hint="Click an outlet to see its full stock list">
                <div className="table-wrap">
                  <table className="table an-table">
                    <thead><tr><th>Outlet</th><th className="num">Stock value</th><th className="num">Materials</th><th className="num">Running low</th><th>Stock list received</th></tr></thead>
                    <tbody>
                      {s.outlets.map((o) => (
                        <tr key={o.slug}>
                          <td><button className="an-link" onClick={() => setStore(o.slug)}>{o.name}</button>{o.brandName ? <div className="muted small">{o.brandName}</div> : null}</td>
                          <td className="num"><b>{o.updatedAt ? rupees(o.value) : "—"}</b></td>
                          <td className="num">{o.updatedAt ? count(o.items) : "—"}</td>
                          <td className="num">{o.low > 0 ? <span className="pill pill-warn">{count(o.low)}</span> : o.updatedAt ? "0" : "—"}</td>
                          <td className="small">{o.updatedAt ? ago(o.updatedAt) : <span className="muted">Not yet</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            ) : null}

            {s.list ? (
              <Panel wide icon={<Boxes size={18} />} title="Stock list" hint={`${count(s.list.length)} materials in this outlet`}
                actions={<input className="input an-small an-find" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find a material…" aria-label="Find a material" />}>
                {s.list.length === 0 ? <Empty>No materials yet. Add them in the POS (Stock screen).</Empty> : (
                  <div className="table-wrap an-scroll">
                    <table className="table an-table">
                      <thead><tr><th>Material</th><th className="num">In stock</th><th className="num">Reorder at</th><th className="num">Last cost</th><th className="num">Value</th></tr></thead>
                      <tbody>
                        {list.map((i) => (
                          <tr key={i.name}>
                            <td><b>{i.name}</b></td>
                            <td className="num">{i.low ? <span className={`pill ${i.onHandMilli <= 0 ? "pill-danger" : "pill-warn"}`}>{amountOf(i.onHandMilli, i.unit)}</span> : amountOf(i.onHandMilli, i.unit)}</td>
                            <td className="num muted">{i.reorderMilli > 0 ? amountOf(i.reorderMilli, i.unit) : "—"}</td>
                            <td className="num">{i.unitCost === null ? <span className="muted">—</span> : `${rupees(i.unitCost)} / ${i.unit}`}</td>
                            <td className="num">{rupees(i.value)}</td>
                          </tr>
                        ))}
                        {list.length === 0 ? <tr><td colSpan={5} className="muted">No material matches &ldquo;{find}&rdquo;.</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            ) : null}

            {p.recent.length > 0 ? (
              <Panel wide icon={<ShoppingBasket size={18} />} title="Recent purchases" hint={p.count > p.recent.length ? `The latest ${p.recent.length} of ${count(p.count)}` : "In these dates, newest first"}>
                <div className="table-wrap an-scroll">
                  <table className="table an-table">
                    <thead><tr><th>Date</th><th>Supplier</th><th>Bill no.</th>{s.outlets.length > 1 ? <th>Outlet</th> : null}<th className="num">Items</th><th className="num">Amount</th></tr></thead>
                    <tbody>
                      {p.recent.map((x, i) => (
                        <tr key={i}>
                          <td className="small" style={{ whiteSpace: "nowrap" }}>{dayLabel(x.date, true)}</td>
                          <td><b>{x.supplier}</b></td>
                          <td className="small">{x.billNo ?? <span className="muted">—</span>}</td>
                          {s.outlets.length > 1 ? <td className="small">{x.storeName}</td> : null}
                          <td className="num">{count(x.lines)}</td>
                          <td className="num"><b>{rupees(x.total)}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            ) : null}
          </div>
          <p className="muted small" style={{ marginTop: 16 }}>Purchases, stock counts and recipes are entered in the POS at each outlet; this page only shows them. Stock is as of the last list each outlet sent. Cancelled purchases are left out.</p>
        </>
      ) : null}
    </div>
  );
}
