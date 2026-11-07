import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { apiRequest } from "./api";
import { buildRegistrationPayload, newRegistrationKey, type RegistrationFields } from "./registration";

type Account = {
  user: { id: string; fullName: string; email: string; phone: string | null; role: string };
  business: {
    organization_id: string; registered_business_name: string | null; trade_name: string;
    business_type: string; industry: string; pan: string | null; gstin: string | null;
    cin: string | null; fssai_license: string | null; website_url: string | null;
    business_email: string | null; business_phone: string | null; address_line1: string;
    address_line2: string | null; locality: string | null; city: string; district: string | null;
    state: string; state_code: string | null; postal_code: string; country_code: string;
  } | null;
};

const initialRegistration: RegistrationFields = {
  fullName: "", email: "", phone: "", password: "", tradeName: "", registeredBusinessName: "",
  businessType: "restaurant", pan: "", gstin: "", cin: "", fssaiLicense: "", websiteUrl: "",
  businessEmail: "", businessPhone: "", businessAddressLine1: "", businessAddressLine2: "",
  businessLocality: "", businessCity: "", businessDistrict: "", businessState: "",
  businessStateCode: "", businessPostalCode: "", outletName: "", outletCode: "", outletPhone: "",
  outletEmail: "", outletAddressLine1: "", outletAddressLine2: "", outletLocality: "",
  outletCity: "", outletDistrict: "", outletState: "", outletStateCode: "", outletPostalCode: "",
  outletGstin: "", outletFssaiLicense: "",
};

function routeTo(path: string) { window.location.href = path; }
function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
function Brand() {
  return <a className="brand" href="/login" aria-label="Fine Dine home"><span className="brand-mark">fd</span><span>fine dine<span className="brand-dot">.</span></span></a>;
}
function Shell({ children, aside = true }: { children: ReactNode; aside?: boolean }) {
  return <main className={aside ? "shell" : "shell shell-wide"}>
    <header className="topbar"><Brand /><span className="topbar-note">Restaurant operations, made simpler.</span></header>
    <div className="shell-content">
      {aside && <aside className="intro-panel">
        <div className="eyebrow">FINE DINE BUSINESS</div>
        <h1>More control.<br /><em>Less chaos.</em></h1>
        <p>One connected workspace for your outlet, your team and every order that matters.</p>
        <div className="intro-points"><span>01 <b>Billing &amp; POS</b></span><span>02 <b>Inventory &amp; reports</b></span><span>03 <b>Kitchen &amp; team</b></span></div>
        <div className="intro-foot">Built for independent restaurants and growing groups.</div>
      </aside>}
      <section className="content-panel">{children}</section>
    </div>
    <footer className="footer"><span>© {new Date().getFullYear()} Fine Dine</span><span>Secure business access</span></footer>
  </main>;
}
function Field({ label, value, onChange, type = "text", required = false, placeholder = "", autoComplete, hint, minLength }: {
  label: string; value: string; onChange: (value: string) => void; type?: string;
  required?: boolean; placeholder?: string; autoComplete?: string; hint?: string; minLength?: number;
}) {
  const id = useId();
  return <label className="field" htmlFor={id}><span>{label}{required && <i> *</i>}</span>
    <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
      placeholder={placeholder} autoComplete={autoComplete} minLength={minLength} />
    {hint && <small>{hint}</small>}
  </label>;
}
function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (value: string) => void; options: string[];
}) {
  const id = `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <label className="field" htmlFor={id}><span>{label} <i>*</i></span><select id={id} value={value} onChange={e => onChange(e.target.value)}>
    {options.map(option => <option key={option} value={option}>{option.replaceAll("_", " ").replace(/^./, c => c.toUpperCase())}</option>)}
  </select></label>;
}
function Notice({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  return <div className={`notice notice-${kind}`} role="status">{children}</div>;
}
function Button({ children, loading = false, disabled = false, onClick }: { children: ReactNode; loading?: boolean; disabled?: boolean; onClick?: () => void }) {
  return <button className="primary-button" type={onClick ? "button" : "submit"} onClick={onClick} disabled={disabled || loading}>{loading ? <><span className="spinner" /> Please wait…</> : children}</button>;
}
function LinkRow({ children }: { children: ReactNode }) { return <div className="link-row">{children}</div>; }

function RegisterPage() {
  const [fields, setFields] = useState(initialRegistration);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [key, setKey] = useState("");
  const set = (name: keyof RegistrationFields) => (value: string) => {
    setFields(old => ({ ...old, [name]: value }));
    setKey("");
  };
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    const requestKey = key || newRegistrationKey();
    setKey(requestKey);
    try {
      await apiRequest("/api/v1/auth/register", {
        method: "POST", headers: { "Idempotency-Key": requestKey },
        body: JSON.stringify(buildRegistrationPayload(fields)),
      });
      setDone(true);
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  async function resendVerification() { setResending(true); setResendMessage(""); try { await apiRequest("/api/v1/auth/resend-verification", { method: "POST", body: JSON.stringify({ email: fields.email }) }); setResendMessage("If this account still needs verification, a fresh link has been sent."); } catch (e) { setResendMessage(messageOf(e)); } finally { setResending(false); } }
  if (done) return <Shell><div className="success-icon">✓</div><div className="eyebrow">REGISTRATION RECEIVED</div>
    <h2>Check your inbox.</h2><p className="muted">We’ve sent a verification link to <b>{fields.email}</b>. Verify your email to activate your account and continue.</p>
    <Notice kind="info">If you don’t see the email, check your spam folder.</Notice>
    {resendMessage && <Notice kind="success">{resendMessage}</Notice>}
    <div className="button-stack"><button className="secondary-button" type="button" disabled={resending} onClick={resendVerification}>{resending ? "Sending…" : "Resend verification email"}</button><Button onClick={() => routeTo("/login")}>Go to sign in</Button></div>
  </Shell>;
  return <Shell><div className="eyebrow">GET STARTED · 14-DAY TRIAL</div><h2>Create your account</h2>
    <p className="muted">Set up your owner login, business profile and first outlet.</p>
    {error && <Notice>{error}</Notice>}
    <form onSubmit={submit} className="form-stack">
      <div className="section-heading"><span>01</span><div><b>Your account</b><small>Who will manage Fine Dine?</small></div></div>
      <div className="form-grid">
        <Field label="Full name" value={fields.fullName} onChange={set("fullName")} required autoComplete="name" />
        <Field label="Email address" type="email" value={fields.email} onChange={set("email")} required autoComplete="email" />
        <Field label="Phone number" type="tel" value={fields.phone} onChange={set("phone")} placeholder="+91 98765 43210" autoComplete="tel" />
        <Field label="Password" type="password" value={fields.password} onChange={set("password")} required autoComplete="new-password" minLength={12} hint="Use at least 12 characters." />
      </div>
      <div className="section-heading"><span>02</span><div><b>Business information</b><small>Tell us about your business entity.</small></div></div>
      <div className="form-grid">
        <Field label="Trading / brand name" value={fields.tradeName} onChange={set("tradeName")} required />
        <Field label="Registered business name" value={fields.registeredBusinessName} onChange={set("registeredBusinessName")} />
        <SelectField label="Business type" value={fields.businessType} onChange={set("businessType")} options={["restaurant","cafe","qsr","bakery","cloud_kitchen","food_truck","grocery","retail","other"]} />
        <Field label="Business email" type="email" value={fields.businessEmail} onChange={set("businessEmail")} />
        <Field label="Business phone" type="tel" value={fields.businessPhone} onChange={set("businessPhone")} />
        <Field label="Website" value={fields.websiteUrl} onChange={set("websiteUrl")} placeholder="https://example.com" />
        <Field label="PAN (optional)" value={fields.pan} onChange={set("pan")} />
        <Field label="GSTIN (optional)" value={fields.gstin} onChange={set("gstin")} />
        <Field label="CIN (optional)" value={fields.cin} onChange={set("cin")} />
        <Field label="FSSAI licence (optional)" value={fields.fssaiLicense} onChange={set("fssaiLicense")} />
      </div>
      <AddressFields title="Registered business address" prefix="business" fields={fields} set={set} />
      <div className="section-heading"><span>03</span><div><b>Your first outlet</b><small>Where you’ll install and use Fine Dine POS.</small></div></div>
      <div className="form-grid">
        <Field label="Outlet name" value={fields.outletName} onChange={set("outletName")} required />
        <Field label="Outlet code" value={fields.outletCode} onChange={set("outletCode")} />
        <Field label="Outlet phone" type="tel" value={fields.outletPhone} onChange={set("outletPhone")} />
        <Field label="Outlet email" type="email" value={fields.outletEmail} onChange={set("outletEmail")} />
        <Field label="Outlet GSTIN (optional)" value={fields.outletGstin} onChange={set("outletGstin")} />
        <Field label="Outlet FSSAI licence" value={fields.outletFssaiLicense} onChange={set("outletFssaiLicense")} />
      </div>
      <AddressFields title="Outlet address" prefix="outlet" fields={fields} set={set} />
      <label className="terms-check"><input type="checkbox" required /> <span>I agree to the Fine Dine Terms of Service and Privacy Policy.</span></label>
      <p className="fine-print">Your 14-day trial begins after your POS environment is successfully provisioned. Tax identifiers are format-checked only and are not verified against government records.</p>
      <Button loading={busy}>Create business account</Button>
    </form>
    <LinkRow><span>Already registered?</span><a href="/login">Sign in</a></LinkRow>
  </Shell>;
}

function AddressFields({ title, prefix, fields, set }: {
  title: string; prefix: "business" | "outlet"; fields: RegistrationFields;
  set: (name: keyof RegistrationFields) => (value: string) => void;
}) {
  const p = prefix === "business" ? "business" : "outlet";
  return <div className="address-block"><h4>{title}</h4><div className="form-grid">
    <Field label="Address line 1" value={fields[`${p}AddressLine1`]} onChange={set(`${p}AddressLine1`)} required />
    <Field label="Address line 2" value={fields[`${p}AddressLine2`]} onChange={set(`${p}AddressLine2`)} />
    <Field label="Locality / area" value={fields[`${p}Locality`]} onChange={set(`${p}Locality`)} />
    <Field label="City" value={fields[`${p}City`]} onChange={set(`${p}City`)} required />
    <Field label="District" value={fields[`${p}District`]} onChange={set(`${p}District`)} />
    <Field label="State" value={fields[`${p}State`]} onChange={set(`${p}State`)} required />
    <Field label="State code (GST)" value={fields[`${p}StateCode`]} onChange={set(`${p}StateCode`)} placeholder="e.g. 29" />
    <Field label="PIN code" value={fields[`${p}PostalCode`]} onChange={set(`${p}PostalCode`)} required />
  </div></div>;
}

function LoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{await apiRequest("/api/v1/auth/login",{method:"POST",body:JSON.stringify({email,password})});routeTo("/dashboard");}catch(err){setError(messageOf(err));setBusy(false);}}
  return <Shell><div className="eyebrow">WELCOME BACK</div><h2>Sign in to Fine Dine</h2><p className="muted">Access your business workspace and outlet tools.</p>
    {error && <Notice>{error}</Notice>}
    <form onSubmit={submit} className="form-stack compact">
      <Field label="Email address" type="email" value={email} onChange={setEmail} required autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} required autoComplete="current-password" />
      <LinkRow><span></span><a href="/forgot-password">Forgot password?</a></LinkRow>
      <Button loading={busy}>Sign in</Button>
    </form>
    <LinkRow><span>New to Fine Dine?</span><a href="/register">Create an account</a></LinkRow>
  </Shell>;
}

function VerifyPage() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [state,setState]=useState<"loading"|"success"|"error">(token?"loading":"error");
  const [error,setError]=useState(token?"":"This verification link is missing its token.");
  useEffect(()=>{if(!token)return;let active=true;apiRequest<{verified:boolean;message:string}>("/api/v1/auth/verify-email",{method:"POST",body:JSON.stringify({token})})
    .then(()=>{if(active)setState("success");}).catch(e=>{if(active){setError(messageOf(e));setState("error");}});
    return()=>{active=false;};},[token]);
  return <Shell><div className="eyebrow">EMAIL VERIFICATION</div>
    {state==="loading"?<><h2>Verifying your email…</h2><p className="muted">This should only take a moment.</p><div className="spinner large"/></>:
      state==="success"?<><div className="success-icon">✓</div><h2>Email verified.</h2><p className="muted">Your Fine Dine account is ready. Sign in to continue.</p><Button onClick={()=>routeTo("/login")}>Continue to sign in</Button></>:
      <><h2>We couldn’t verify this link.</h2><Notice>{error}</Notice><p className="muted">The link may have expired or already been used. Request a fresh verification email if needed.</p><Button onClick={()=>routeTo("/login")}>Back to sign in</Button></>}
  </Shell>;
}

function ForgotPage() {
  const [email,setEmail]=useState(""); const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false); const [error,setError]=useState("");
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{await apiRequest("/api/v1/auth/forgot-password",{method:"POST",body:JSON.stringify({email})});setDone(true);}catch(err){setError(messageOf(err));}finally{setBusy(false);}}
  return <Shell><div className="eyebrow">ACCOUNT RECOVERY</div><h2>Reset your password</h2>
    <p className="muted">Enter the email address linked to your account. If it exists, we’ll send a reset link.</p>
    {error&&<Notice>{error}</Notice>}
    {done?<Notice kind="success">If an account exists, password reset instructions have been sent. Check your inbox.</Notice>:
      <form onSubmit={submit} className="form-stack compact"><Field label="Email address" type="email" value={email} onChange={setEmail} required autoComplete="email"/><Button loading={busy}>Send reset link</Button></form>}
    <LinkRow><a href="/login">Back to sign in</a></LinkRow>
  </Shell>;
}

function ResetPage() {
  const token=new URLSearchParams(window.location.search).get("token")||"";
  const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [done,setDone]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setError("");if(password!==confirm){setError("Your passwords do not match.");return;}setBusy(true);
    try{await apiRequest("/api/v1/auth/reset-password",{method:"POST",body:JSON.stringify({token,newPassword:password})});setDone(true);}
    catch(err){setError(messageOf(err));}finally{setBusy(false);}}
  return <Shell><div className="eyebrow">ACCOUNT RECOVERY</div><h2>Choose a new password</h2>
    {!token&&<Notice>This reset link is missing its token.</Notice>}
    {error&&<Notice>{error}</Notice>}
    {done?<><Notice kind="success">Your password has been updated. Sign in with your new password.</Notice><Button onClick={()=>routeTo("/login")}>Go to sign in</Button></>:
      <form onSubmit={submit} className="form-stack compact">
        <Field label="New password" type="password" value={password} onChange={setPassword} required minLength={12} hint="Use at least 12 characters."/>
        <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} required minLength={12}/>
        <Button loading={busy} disabled={!token}>Update password</Button>
      </form>}
    <LinkRow><a href="/login">Back to sign in</a></LinkRow>
  </Shell>;
}

type ProfileFields = {
  tradeName:string;registeredBusinessName:string;businessType:string;industry:string;cin:string;
  fssaiLicense:string;websiteUrl:string;businessEmail:string;businessPhone:string;
  addressLine1:string;addressLine2:string;locality:string;city:string;district:string;
  state:string;stateCode:string;postalCode:string;countryCode:string;pan:string;gstin:string;
};
function DashboardPage() {
  const [account,setAccount]=useState<Account|null>(null);const [profile,setProfile]=useState<ProfileFields|null>(null);
  const [busy,setBusy]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
  useEffect(()=>{let active=true;apiRequest<Account>("/api/v1/account/me").then(data=>{
    if(!active)return;setAccount(data);const b=data.business;if(!b)return;
    setProfile({tradeName:b.trade_name||"",registeredBusinessName:b.registered_business_name||"",businessType:b.business_type||"restaurant",industry:b.industry||"food_service",
      cin:b.cin||"",fssaiLicense:b.fssai_license||"",websiteUrl:b.website_url||"",businessEmail:b.business_email||"",businessPhone:b.business_phone||"",
      addressLine1:b.address_line1||"",addressLine2:b.address_line2||"",locality:b.locality||"",city:b.city||"",district:b.district||"",
      state:b.state||"",stateCode:b.state_code||"",postalCode:b.postal_code||"",countryCode:b.country_code||"IN",pan:"",gstin:""});
  }).catch(e=>{if(active)setError(messageOf(e));}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[]);
  const set=(name:keyof ProfileFields)=>(value:string)=>setProfile(old=>old?({...old,[name]:value}):old);
  async function save(e:FormEvent){e.preventDefault();if(!profile)return;setSaving(true);setError("");setNotice("");
    const address={addressLine1:profile.addressLine1,addressLine2:profile.addressLine2||undefined,locality:profile.locality||undefined,
      city:profile.city,district:profile.district||undefined,state:profile.state,stateCode:profile.stateCode||undefined,
      postalCode:profile.postalCode,countryCode:profile.countryCode};
    const body={tradeName:profile.tradeName,registeredBusinessName:profile.registeredBusinessName||null,businessType:profile.businessType,
      industry:profile.industry,cin:profile.cin||null,fssaiLicense:profile.fssaiLicense||null,websiteUrl:profile.websiteUrl||null,
      businessEmail:profile.businessEmail||null,businessPhone:profile.businessPhone||null,address,
      ...(profile.pan.trim()?{pan:profile.pan.trim().toUpperCase()}:{}),...(profile.gstin.trim()?{gstin:profile.gstin.trim().toUpperCase()}:{})};
    try{await apiRequest("/api/v1/business-profile",{method:"PATCH",body:JSON.stringify(body)});setNotice("Business profile saved.");setProfile({...profile,pan:"",gstin:""});}
    catch(err){setError(messageOf(err));}finally{setSaving(false);}}
  async function logout(){try{await apiRequest("/api/v1/auth/logout",{method:"POST"});}finally{routeTo("/login");}}
  if(busy)return <Shell aside={false}><div className="loading-state"><div className="spinner large"/><p>Loading your business workspace…</p></div></Shell>;
  if(error&&!account)return <Shell aside={false}><h2>Sign in required</h2><Notice>{error}</Notice><Button onClick={()=>routeTo("/login")}>Go to sign in</Button></Shell>;
  return <Shell aside={false}><div className="dashboard-top"><div><div className="eyebrow">BUSINESS WORKSPACE</div><h2>Hello, {account?.user.fullName.split(" ")[0] || "there"}.</h2><p className="muted">Here’s your Fine Dine account overview.</p></div><button className="secondary-button" onClick={logout}>Sign out ↗</button></div>
    {notice&&<Notice kind="success">{notice}</Notice>}{error&&<Notice>{error}</Notice>}
    <div className="dashboard-cards"><div className="stat-card"><small>ACCOUNT EMAIL</small><b>{account?.user.email}</b><span className="status-pill">Verified account</span></div>
      <div className="stat-card"><small>ACCESS ROLE</small><b>{account?.user.role}</b><span>Organization access</span></div>
      <div className="stat-card"><small>BUSINESS</small><b>{account?.business?.trade_name||"Not set"}</b><span>{account?.business?.business_type?.replaceAll("_"," ")}</span></div></div>
    {profile&&<form onSubmit={save} className="profile-card form-stack"><div><div className="eyebrow">BUSINESS SETTINGS</div><h3>Business profile</h3><p className="muted">Keep your business identity and registered address up to date.</p></div>
      <div className="form-grid">
        <Field label="Trading / brand name" value={profile.tradeName} onChange={set("tradeName")} required/>
        <Field label="Registered business name" value={profile.registeredBusinessName} onChange={set("registeredBusinessName")}/>
        <SelectField label="Business type" value={profile.businessType} onChange={set("businessType")} options={["restaurant","cafe","qsr","bakery","cloud_kitchen","food_truck","grocery","retail","other"]}/>
        <Field label="Industry" value={profile.industry} onChange={set("industry")} required/>
        <Field label="Business email" type="email" value={profile.businessEmail} onChange={set("businessEmail")}/>
        <Field label="Business phone" value={profile.businessPhone} onChange={set("businessPhone")}/>
        <Field label="Website" value={profile.websiteUrl} onChange={set("websiteUrl")}/>
        <Field label="CIN" value={profile.cin} onChange={set("cin")}/>
        <Field label="FSSAI licence" value={profile.fssaiLicense} onChange={set("fssaiLicense")}/>
        <Field label="Replace PAN (optional)" value={profile.pan} onChange={set("pan")} placeholder={account?.business?.pan? "Saved PAN on file — leave blank to keep": "Enter PAN"}/>
        <Field label="Replace GSTIN (optional)" value={profile.gstin} onChange={set("gstin")} placeholder={account?.business?.gstin? "Saved GSTIN on file — leave blank to keep": "Enter GSTIN"}/>
      </div>
      <div className="address-block"><h4>Registered address</h4><div className="form-grid">
        <Field label="Address line 1" value={profile.addressLine1} onChange={set("addressLine1")} required/>
        <Field label="Address line 2" value={profile.addressLine2} onChange={set("addressLine2")}/>
        <Field label="Locality" value={profile.locality} onChange={set("locality")}/>
        <Field label="City" value={profile.city} onChange={set("city")} required/>
        <Field label="District" value={profile.district} onChange={set("district")}/>
        <Field label="State" value={profile.state} onChange={set("state")} required/>
        <Field label="State code" value={profile.stateCode} onChange={set("stateCode")}/>
        <Field label="PIN code" value={profile.postalCode} onChange={set("postalCode")} required/>
      </div></div>
      <div className="save-row"><span className="fine-print">Saved PAN/GSTIN values are retained unless you enter a replacement.</span><Button loading={saving}>Save business profile</Button></div>
    </form>}
    <div className="coming-soon"><div><b>More tools are on the way</b><p>Subscription billing, outlet and device management, and trial provisioning status will be added in a later release.</p></div><span>COMING SOON</span></div>
  </Shell>;
}


function LandingPage() {
  const products = [
    { icon: "▦", name: "Tiffin & QSR POS", tag: "FAST SERVICE", desc: "Quick billing, counter orders, kitchen tickets and inventory for high-volume service.", features: ["Fast counter billing", "Kitchen order tickets", "Stock & recipe control"] },
    { icon: "◫", name: "Fine Dine POS", tag: "TABLE SERVICE", desc: "Manage tables, captains, courses, KOTs and split settlements from one workspace.", features: ["Live floor & table plan", "Captain ordering", "KOT & split bills"] },
    { icon: "⌗", name: "Table QR Ordering", tag: "CONTACTLESS", desc: "Let guests scan, browse your menu and order directly from their table.", features: ["Branded QR menus", "Table-linked orders", "Guest-friendly checkout"] },
    { icon: "↗", name: "Food Ordering Website", tag: "DIRECT ORDERS", desc: "Launch your own ordering website with pickup, delivery and a branded menu.", features: ["Your own brand & domain", "Online payments", "Delivery & pickup"] },
    { icon: "▣", name: "Food Ordering App", tag: "MOBILE COMMERCE", desc: "Give regular customers a convenient way to discover, order and track food.", features: ["Customer accounts", "Order tracking", "Push-ready experience"] },
  ];
  const capabilities = [
    ["01", "One connected POS", "Bring dine-in, takeaway, delivery and online orders into a single operating view."],
    ["02", "Kitchen that stays in sync", "Send orders to the right kitchen station and track preparation without re-entering tickets."],
    ["03", "Inventory with visibility", "Keep an eye on ingredients, recipes, stock movement and low-stock items."],
    ["04", "Business-ready insights", "Understand sales, taxes, outlet performance and daily operations with clear reports."],
    ["05", "Built to grow", "Start with one outlet and enable more products, locations and teams as you expand."],
    ["06", "Made for your workflow", "Choose the products and capabilities that match the way your restaurant operates."],
  ];
  return <main className="marketing">
    <header className="marketing-nav">
      <a className="marketing-brand" href="/"><span className="brand-mark">fd</span><span>fine dine<span className="brand-dot">.</span></span></a>
      <nav className="marketing-links"><a href="#products">Products</a><a href="#platform">Platform</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a></nav>
      <div className="nav-actions"><a className="nav-login" href="/login">Log in</a><a className="nav-cta" href="/register">Get started <span>↗</span></a></div>
    </header>
    <section className="hero-section">
      <div className="hero-copy">
        <div className="hero-kicker"><span></span> THE OPERATING PLATFORM FOR RESTAURANTS</div>
        <h1>Everything your restaurant needs.<br/><em>All in one place.</em></h1>
        <p>Run your restaurant with one connected platform for POS billing, kitchen operations, QR ordering and direct online orders. Start simple. Scale confidently.</p>
        <div className="hero-actions"><a className="hero-primary" href="/register">Start your free trial <span>↗</span></a><a className="hero-secondary" href="#products">Explore products <span>↓</span></a></div>
        <div className="hero-proof"><span>✓ Easy onboarding</span><span>✓ Multi-outlet ready</span><span>✓ Built for India</span></div>
      </div>
      <div className="hero-visual">
        <div className="visual-glow"></div>
        <div className="dashboard-preview">
          <div className="preview-top"><div className="preview-brand"><span>fd</span> Fine Dine <small>WORKSPACE</small></div><div className="preview-live"><i></i> LIVE OVERVIEW</div></div>
          <div className="preview-welcome"><div><small>MONDAY, 07 NOVEMBER</small><h3>Good morning, Souvik 👋</h3><p>Here’s what’s happening across your outlet today.</p></div><span className="preview-select">All outlets⌄</span></div>
          <div className="preview-stats"><div><small>TODAY'S SALES</small><b>₹48,290</b><span className="up">↗ 12.8% vs yesterday</span></div><div><small>ORDERS</small><b>186</b><span>Across all channels</span></div><div><small>AVG. ORDER VALUE</small><b>₹259.62</b><span>+ 8.4% this week</span></div></div>
          <div className="preview-lower"><div className="preview-chart"><div className="preview-chart-head"><b>Sales overview</b><small>THIS WEEK⌄</small></div><div className="chart-bars"><i style={{height:"38%"}}></i><i style={{height:"55%"}}></i><i style={{height:"46%"}}></i><i style={{height:"72%"}}></i><i style={{height:"61%"}}></i><i style={{height:"88%"}}></i><i style={{height:"100%"}}></i></div><div className="chart-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div><div className="preview-orders"><b>Recent orders</b><div><span className="order-dot green"></span><p>#1048 <small>Table 06 · Dine in</small></p><strong>₹840</strong></div><div><span className="order-dot amber"></span><p>#1047 <small>Online · Pickup</small></p><strong>₹520</strong></div><div><span className="order-dot blue"></span><p>#1046 <small>Table 02 · Dine in</small></p><strong>₹1,240</strong></div></div></div>
        </div>
        <div className="float-chip chip-orders"><span>↗</span><div><b>All orders, one view</b><small>POS · QR · Online</small></div></div>
        <div className="float-chip chip-kitchen"><span>✓</span><div><b>Kitchen connected</b><small>Tickets flowing live</small></div></div>
      </div>
    </section>
    <section className="trust-strip"><span>ONE PLATFORM. MULTIPLE WAYS TO SERVE.</span><div><b>QSR & TIFFIN</b><b>FINE DINING</b><b>CAFÉS</b><b>CLOUD KITCHENS</b><b>RESTAURANT GROUPS</b></div></section>
    <section className="products-section" id="products"><div className="section-intro"><div><div className="section-kicker">A PRODUCT FOR EVERY SERVICE STYLE</div><h2>Choose what your business needs.<br/><em>Connect everything later.</em></h2></div><p>Five focused products. One shared foundation for your business, outlets, team and growth.</p></div>
      <div className="product-grid">{products.map((p,i)=><article className={i===1?"product-card featured-product":"product-card"} key={p.name}><div className="product-card-top"><span className="product-icon">{p.icon}</span><small>{p.tag}</small></div><h3>{p.name}</h3><p>{p.desc}</p><ul>{p.features.map(x=><li key={x}><span>✓</span>{x}</li>)}</ul><a href="/register">Explore product <span>↗</span></a></article>)}</div>
    </section>
    <section className="platform-section" id="platform"><div className="platform-copy"><div className="section-kicker">ONE CONNECTED PLATFORM</div><h2>Less switching.<br/><em>More serving.</em></h2><p>Your front counter, kitchen, customers and business operations should work together. Fine Dine brings the everyday restaurant workflow into one connected system.</p><a className="dark-link" href="/register">Build your workspace <span>↗</span></a></div><div className="platform-list">{capabilities.map(([n,t,d])=><div className="capability-row" key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div><b>↗</b></div>)}</div></section>
    <section className="workflow-section" id="how-it-works"><div className="section-kicker">SIMPLE FROM DAY ONE</div><h2>From first order to final report.</h2><p className="workflow-sub">A connected flow that keeps your team moving.</p><div className="workflow-steps"><div><span>01</span><b>Take the order</b><p>POS, captain, QR or online ordering.</p></div><i>→</i><div><span>02</span><b>Prepare & serve</b><p>Send tickets to the right kitchen station.</p></div><i>→</i><div><span>03</span><b>Bill & settle</b><p>Manage payments and GST-ready billing.</p></div><i>→</i><div><span>04</span><b>Track performance</b><p>Review sales, stock and outlet reports.</p></div></div></section>
    <section className="pricing-section" id="pricing"><div><div className="section-kicker">FLEXIBLE FOR YOUR BUSINESS</div><h2>Start with what you need.<br/><em>Scale when you're ready.</em></h2><p>Choose the products and outlet setup that fit your operation. Add capabilities as your business grows.</p></div><div className="pricing-card"><span className="pricing-label">YOUR RESTAURANT WORKSPACE</span><h3>One platform. Your choice.</h3><p>Product plans designed around your service model, with room to expand across outlets.</p><ul><li>Choose from five restaurant products</li><li>Enable products for each outlet</li><li>Manage your business from one account</li></ul><a href="/register">Create your account <span>↗</span></a><small>Plan and pricing details are shared during onboarding.</small></div></section>
    <section className="final-cta"><div><div className="section-kicker">YOUR NEXT SERVICE STARTS HERE</div><h2>Ready to run a smarter restaurant?</h2><p>Bring your orders, kitchen and operations together with Fine Dine.</p></div><a href="/register">Get started today <span>↗</span></a></section>
    <footer className="marketing-footer"><a className="marketing-brand" href="/"><span className="brand-mark">fd</span><span>fine dine<span className="brand-dot">.</span></span></a><span>Restaurant operations, made simpler.</span><div><a href="/login">Log in</a><a href="/register">Create account</a></div><small>© {new Date().getFullYear()} Fine Dine. All rights reserved.</small></footer>
  </main>;
}

export default function App() {
  const path=window.location.pathname.replace(/\/+$/,"")||"/";
  if(path==="/register")return <RegisterPage/>;
  if(path==="/verify-email")return <VerifyPage/>;
  if(path==="/forgot-password")return <ForgotPage/>;
  if(path==="/reset-password")return <ResetPage/>;
  if(path==="/dashboard")return <DashboardPage/>;
  if(path==="/")return <LandingPage/>;
  if(path==="/login")return <LoginPage/>;
  return <Shell><div className="eyebrow">PAGE NOT FOUND</div><h2>We can’t find that page.</h2><a className="text-link" href="/login">Return to sign in</a></Shell>;
}
