import { CheckCircle2, Download, LogIn, Monitor, Puzzle, ShieldCheck, Store, UserPlus, UtensilsCrossed, WifiOff, Zap } from "lucide-react";
import type { ProductCode } from "../api";
import { PRODUCT_COPY, PRODUCT_ORDER } from "../products";
import { Link } from "../router";

const ICON: Record<ProductCode, typeof Zap> = { tiffin_qsr: Zap, fine_dine: UtensilsCrossed };

export function Home() {
  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <span className="kicker">Restaurant POS for Windows</span>
          <h1>Bill faster. Serve <em>better.</em></h1>
          <p className="lead">
            Point of sale for quick-service counters and full-service dining rooms. Install it on your outlet&rsquo;s PC,
            sign in, and use everything free for 30 days.
          </p>
          <div className="row hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Start 30-day free trial</Link>
            <a href="#products" className="btn btn-lg">See the products</a>
          </div>
          <div className="hero-proof">
            <span><ShieldCheck size={16} /> No card needed</span>
            <span><WifiOff size={16} /> Works offline</span>
            <span><Monitor size={16} /> Windows 10 and 11</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="card pad mock-bill">
            <div className="mock-head"><span>Table 7 · 4 guests</span><span className="pill pill-primary">KOT sent</span></div>
            <div className="mock-line"><span>Paneer tikka × 2</span><b>₹ 640.00</b></div>
            <div className="mock-line"><span>Dal makhani</span><b>₹ 380.00</b></div>
            <div className="mock-line"><span>Butter naan × 4</span><b>₹ 240.00</b></div>
            <div className="mock-line"><span>GST 5%</span><b>₹ 63.00</b></div>
            <div className="mock-line mock-total"><span>Total</span><b>₹ 1,323.00</b></div>
          </div>
        </div>
      </section>

      <section className="section" id="products">
        <div className="section-head">
          <span className="kicker">Choose your product</span>
          <h2>One account, the POS that fits your service</h2>
          <p>Pick QSR, Fine Dine, or both. Each comes with its own add-on and its own 30-day trial.</p>
        </div>
        <div className="products">
          {PRODUCT_ORDER.map((code) => {
            const p = PRODUCT_COPY[code];
            const Icon = ICON[code];
            return (
              <article key={code} className="card product">
                <div className="row">
                  <span className="product-icon"><Icon size={24} /></span>
                  <div>
                    <h3>{p.name}</h3>
                    <span className="muted small">{p.app} for Windows</span>
                  </div>
                </div>
                <p>{p.tagline}</p>
                <ul className="ticks">
                  {p.points.map((t) => <li key={t}><CheckCircle2 size={16} />{t}</li>)}
                </ul>
                <div className="addon"><Puzzle size={18} /><span><b>Add-on: {p.addon.name}.</b> {p.addon.about}</span></div>
                <Link to={`/register?product=${code}`} className="btn btn-primary">Start with {p.name}</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section" id="how">
        <div className="section-head">
          <span className="kicker">How it works</span>
          <h2>From sign-up to your first bill in minutes</h2>
        </div>
        <div className="steps">
          {[
            { icon: UserPlus, t: "Create your account", d: "Choose QSR or Fine Dine and confirm your email with a code." },
            { icon: Download, t: "Download for Windows", d: "Get the app and its add-on from your client area." },
            { icon: LogIn, t: "Sign in on the PC", d: "Open the app and sign in: your 30-day trial starts on that PC." },
            { icon: Store, t: "Keep billing", d: "Choose a plan before the trial ends. Your data stays on your PC." },
          ].map((s, i) => (
            <div key={s.t} className="card step">
              <span className="step-num">{i + 1}</span>
              <b>{s.t}</b>
              <span className="muted small">{s.d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Try it at your outlet for 30 days</h2>
          <p>Full features, your own menu and tables. No card needed.</p>
        </div>
        <Link to="/register" className="btn btn-primary btn-lg">Create your account</Link>
      </section>
    </div>
  );
}
