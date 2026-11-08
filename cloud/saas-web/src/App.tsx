import { Layout } from "./components/Layout";
import { Forgot, Login, Register } from "./pages/Auth";
import { ClientArea } from "./pages/ClientArea";
import { Home } from "./pages/Home";
import { Link, useLocation } from "./router";
import { SessionProvider } from "./session";

function Page() {
  const { path } = useLocation();
  if (path === "/") return <Home />;
  if (path === "/register" || path === "/signup") return <Register />;
  if (path === "/login") return <Login />;
  if (path === "/forgot") return <Forgot />;
  if (path === "/app" || path.startsWith("/app/")) return <ClientArea path={path} />;
  return (
    <div className="wrap empty">
      <h1>Page not found</h1>
      <p className="muted" style={{ marginTop: 12 }}><Link to="/">Go to the home page</Link></p>
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <Layout><Page /></Layout>
    </SessionProvider>
  );
}
