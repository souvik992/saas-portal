import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Keeps one broken page from blanking the whole portal: the top bar and footer stay, and the person gets a way back.
 * `resetKey` is the path, so moving to another page tries again.
 */
export class PageGuard extends Component<{ resetKey: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("A portal page failed to show", error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey: string }): void {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="wrap empty" role="alert">
        <h1 style={{ fontSize: 28 }}>This page could not be shown</h1>
        <p className="muted" style={{ marginTop: 12 }}>
          Something on it did not load as expected. Try again, or go back to the dashboard. If it keeps happening, write to{" "}
          <a href="mailto:support@posinext.com">support@posinext.com</a>.
        </p>
        <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => location.reload()}>Try again</button>
          <a className="btn" href="/app">Go to the dashboard</a>
        </div>
      </div>
    );
  }
}
