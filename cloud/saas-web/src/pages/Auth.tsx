import { Check, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { account, ApiError, type ProductCode } from "../api";
import { Notice } from "../components/Layout";
import { checkCode, checkSignup, toggleProduct, type FieldErrors, type SignupForm } from "../forms";
import { PRODUCT_COPY, PRODUCT_ORDER, productForType, productFromQuery, RESTAURANT_TYPES, restaurantTypeOf, type RestaurantType } from "../products";
import { Link, navigate, useLocation } from "../router";
import { useSession } from "../session";

function Field({ label, error, hint, children }: { label: string; error?: string | undefined; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <small className="err">{error}</small> : hint ? <small>{hint}</small> : null}
    </label>
  );
}

/** The photo beside the sign-in and sign-up forms (free Unsplash photos, kept in public/auth/). */
const PHOTOS = {
  signin: { src: "/auth/signin-owner.jpg", alt: "A restaurant owner standing in his dining room", position: "50% 30%" },
  register: { src: "/auth/register-bar.jpg", alt: "A warmly lit restaurant bar with bottles, glasses and a POS terminal on the counter", position: "50% 55%" },
} as const;

function AuthPage({ side, photo = "signin", children }: { side: ReactNode; photo?: keyof typeof PHOTOS; children: ReactNode }) {
  const p = PHOTOS[photo];
  return (
    <div className="wrap auth">
      <div className="auth-side auth-photo">
        <img src={p.src} alt={p.alt} style={{ objectPosition: p.position }} />
        <div className="auth-photo-text">{side}</div>
      </div>
      <div className="card auth-card">{children}</div>
    </div>
  );
}

const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

/** The 6-digit email code: after sign-up, or when signing in before the email was confirmed. */
function VerifyCode({ email, onDone }: { email: string; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const bad = checkCode(code);
    if (bad) { setError(bad); return; }
    setBusy(true); setError(null);
    try { await account.verify(email, code.trim()); onDone(); } catch (err) { setError(message(err)); } finally { setBusy(false); }
  };
  const resend = async () => {
    setError(null);
    try { await account.resend(email); setInfo("We have sent a new code."); } catch (err) { setError(message(err)); }
  };
  return (
    <form className="stack" onSubmit={(e) => void submit(e)} noValidate>
      <div>
        <h2>Check your email</h2>
        <p className="muted">We sent a 6-digit code to <b>{email}</b>. It works for 10 minutes.</p>
      </div>
      <Notice>{error}</Notice>
      <Notice kind="ok">{info}</Notice>
      <Field label="Code">
        <input className="input input-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} autoFocus
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="6-digit code" />
      </Field>
      <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? "Checking…" : "Confirm email"}</button>
      <div className="links"><span className="muted">No email? Check spam, or</span><button type="button" className="btn btn-ghost" onClick={() => void resend()}>send a new code</button></div>
    </form>
  );
}

const TRIAL_POINTS = (
  <ul className="ticks">
    <li><CheckCircle2 size={16} />30 days free on your outlet&rsquo;s PC</li>
    <li><CheckCircle2 size={16} />Download the Windows app and its add-on</li>
    <li><CheckCircle2 size={16} />No card needed</li>
  </ul>
);

export function Register() {
  const { query } = useLocation();
  const { reload } = useSession();
  const first = productFromQuery(query.get("product"));
  const [form, setForm] = useState<SignupForm>({ businessName: "", name: "", email: "", phone: "", password: "", products: first ? [first] : [] });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [type, setType] = useState<RestaurantType | null>(first === "fine_dine" ? "fine_dine" : null);
  // typing in a field clears that field's message
  const clear = (k: keyof FieldErrors) => setErrors((prev) => { const { [k]: _gone, ...rest } = prev; return rest; });
  const set = (k: keyof Omit<SignupForm, "products">) => (e: { target: { value: string } }) => { setForm({ ...form, [k]: e.target.value }); clear(k); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const bad: FieldErrors = { ...(type ? {} : { restaurantType: "Choose your restaurant type." }), ...checkSignup(form) };
    setErrors(bad);
    if (Object.keys(bad).length) return;
    setBusy(true); setError(null);
    try {
      const r = await account.signup({ ...form, email: form.email.trim() });
      if (r.verify) setVerifying(r.email); else { await reload(); navigate("/app?welcome=1"); }
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields as FieldErrors);
      setError(err instanceof ApiError && err.code === "EMAIL_TAKEN" ? null : message(err));
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") setErrors({ email: err.message });
    } finally { setBusy(false); }
  };

  const side = (
    <>
      <span className="kicker">Free trial</span>
      <h1>Start your <em>30-day</em> trial</h1>
      <p className="muted">Create your account, download the app, and sign in on your PC. That&rsquo;s it.</p>
      {TRIAL_POINTS}
    </>
  );

  if (verifying) {
    return <AuthPage side={side} photo="register"><VerifyCode email={verifying} onDone={() => void reload().then(() => navigate("/app?welcome=1"))} /></AuthPage>;
  }
  return (
    <AuthPage side={side} photo="register">
      <form className="stack" onSubmit={(e) => void submit(e)} noValidate>
        <div>
          <h2>Create your account</h2>
          <p className="muted">Already have one? <Link to="/">Sign in</Link></p>
        </div>
        <Notice>{error}</Notice>
        <Field label="Restaurant type" error={errors.restaurantType}>
          <select className="input select" value={type ?? ""} aria-invalid={!!errors.restaurantType}
            onChange={(e) => {
              const t = restaurantTypeOf(e.target.value);
              setType(t);
              if (t) { setForm({ ...form, products: [productForType(t)] }); clear("products"); }
              clear("restaurantType");
            }}>
            <option value="" disabled>Choose your restaurant type</option>
            {RESTAURANT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <div className="field">
          <span>Your product</span>
          <div className="choice-grid" role="group" aria-label="Products">
            {PRODUCT_ORDER.map((code: ProductCode) => {
              const p = PRODUCT_COPY[code];
              const on = form.products.includes(code);
              return (
                <button key={code} type="button" className="choice" aria-pressed={on} onClick={() => { setForm({ ...form, products: toggleProduct(form.products, code) }); clear("products"); }}>
                  <span className="tick" aria-hidden>{on ? <Check size={14} strokeWidth={3} /> : null}</span>
                  <b>{p.name}</b>
                  <small>{p.app} · {p.addon.name}</small>
                </button>
              );
            })}
          </div>
          {errors.products ? <small className="err">{errors.products}</small> : <small>{type ? `${PRODUCT_COPY[productForType(type)].app} is picked for your restaurant type. Choose both if you run both kinds of outlet.` : "Choose one, or both if you run both kinds of outlet."}</small>}
        </div>
        <div className="divider" />
        <Field label="Business name" error={errors.businessName}><input className="input" value={form.businessName} onChange={set("businessName")} autoComplete="organization" aria-invalid={!!errors.businessName} /></Field>
        <div className="grid-2">
          <Field label="Your name" error={errors.name}><input className="input" value={form.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} /></Field>
          <Field label="Mobile" error={errors.phone}><input className="input" value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="98765 43210" aria-invalid={!!errors.phone} /></Field>
        </div>
        <Field label="Email" error={errors.email}><input className="input" value={form.email} onChange={set("email")} type="email" autoComplete="email" aria-invalid={!!errors.email} /></Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters. You also use it to sign in on your PC."><input className="input" value={form.password} onChange={set("password")} type="password" autoComplete="new-password" aria-invalid={!!errors.password} /></Field>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="muted small">One free trial per product for each business, PC and mobile number.</p>
      </form>
    </AuthPage>
  );
}

export function Login() {
  const { reload } = useSession();
  const { query } = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const next = query.get("next")?.startsWith("/app") ? query.get("next")! : "/app";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setBusy(true); setError(null);
    try {
      await account.login(email.trim(), password);
      await reload();
      navigate(next);
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") setVerifying(String(err.details.email ?? email.trim().toLowerCase()));
      else setError(message(err));
    } finally { setBusy(false); }
  };

  const side = (
    <>
      <span className="kicker">Client area</span>
      <h1>Welcome <em>back</em></h1>
      <p className="muted">Downloads, licences, add-ons and support for your outlets.</p>
    </>
  );
  if (verifying) return <AuthPage side={side}><VerifyCode email={verifying} onDone={() => void reload().then(() => navigate(next))} /></AuthPage>;
  return (
    <AuthPage side={side}>
      <form className="stack" onSubmit={(e) => void submit(e)} noValidate>
        <div>
          <h2>Sign in</h2>
          <p className="muted">New here? <Link to="/register">Create an account</Link></p>
        </div>
        <Notice>{error}</Notice>
        <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" autoFocus /></Field>
        <Field label="Password"><input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" /></Field>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <div className="links"><Link to="/forgot">Forgot your password?</Link></div>
      </form>
    </AuthPage>
  );
}

export function Forgot() {
  const { reload } = useSession();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your email."); return; }
    setBusy(true); setError(null);
    try { await account.forgot(email.trim()); setSent(true); } catch (err) { setError(message(err)); } finally { setBusy(false); }
  };
  const reset = async (e: FormEvent) => {
    e.preventDefault();
    const bad = checkCode(code) ?? (password.length < 8 ? "The new password needs at least 8 characters." : null);
    if (bad) { setError(bad); return; }
    setBusy(true); setError(null);
    try { await account.reset(email.trim(), code.trim(), password); await reload(); navigate("/app"); } catch (err) { setError(message(err)); } finally { setBusy(false); }
  };

  const side = (
    <>
      <span className="kicker">Password</span>
      <h1>Reset your <em>password</em></h1>
      <p className="muted">We email you a code. Every other sign-in is ended when the password changes.</p>
    </>
  );
  return (
    <AuthPage side={side}>
      {!sent ? (
        <form className="stack" onSubmit={(e) => void ask(e)} noValidate>
          <h2>Forgot your password?</h2>
          <Notice>{error}</Notice>
          <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" autoFocus /></Field>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? "Sending…" : "Email me a code"}</button>
          <div className="links"><Link to="/">Back to sign in</Link></div>
        </form>
      ) : (
        <form className="stack" onSubmit={(e) => void reset(e)} noValidate>
          <div>
            <h2>Enter the code</h2>
            <p className="muted">If <b>{email.trim()}</b> has an account, a code is on its way.</p>
          </div>
          <Notice>{error}</Notice>
          <Field label="Code"><input className="input input-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus /></Field>
          <Field label="New password" hint="At least 8 characters."><input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" /></Field>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? "Saving…" : "Set new password"}</button>
        </form>
      )}
    </AuthPage>
  );
}
