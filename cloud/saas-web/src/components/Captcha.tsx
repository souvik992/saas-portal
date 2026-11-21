import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { account, type CaptchaAnswer } from "../api";
import { checkCaptcha } from "../forms";

/**
 * The picture captcha on sign-in and sign-up. The cloud says whether it wants one (its security checks); when it does not, or
 * is an older cloud without the route, nothing is shown and nothing is sent. Each picture can be tried once, so the form
 * calls `renew()` after every failed submit.
 */
export function useCaptcha() {
  const [state, setState] = useState<"loading" | "off" | "on">("loading");
  const [id, setId] = useState("");
  const [image, setImage] = useState("");
  const [answer, setAnswer] = useState("");

  const renew = useCallback(async () => {
    setAnswer("");
    try {
      const c = await account.captcha();
      if (!c.enabled) { setState("off"); return; }
      setId(c.id); setImage(c.image); setState("on");
    } catch {
      // an older cloud (no such route) or offline: sign-in still works, and the cloud says so if it needs an answer
      setState((s) => (s === "on" ? "on" : "off"));
    }
  }, []);
  useEffect(() => { void renew(); }, [renew]);

  return {
    state, image, answer, setAnswer, renew,
    /** null when the answer is fine (or no captcha), else the message for the field. */
    check: () => (state === "on" ? checkCaptcha(answer) : null),
    /** The fields to send with the form, or nothing when there is no captcha. */
    payload: (): CaptchaAnswer | undefined => (state === "on" ? { captchaId: id, captcha: answer.replace(/\s+/g, "") } : undefined),
  };
}

export function CaptchaField({ captcha, error, onType }: { captcha: ReturnType<typeof useCaptcha>; error?: string | undefined; onType?: () => void }) {
  if (captcha.state === "off") return null;
  return (
    <div className="field">
      <span id="captcha-label">Type the characters you see</span>
      <div className="captcha-row">
        {captcha.state === "on"
          ? <img className="captcha-img" src={captcha.image} alt="Picture of 5 characters to type" />
          : <div className="captcha-img captcha-wait">Loading…</div>}
        <button type="button" className="btn btn-ghost" onClick={() => void captcha.renew()} aria-label="Show a new picture" title="Show a new picture">
          <RefreshCw size={16} />
        </button>
      </div>
      <input className="input input-captcha" value={captcha.answer} maxLength={12} autoComplete="off" autoCapitalize="characters" spellCheck={false}
        aria-labelledby="captcha-label" aria-invalid={!!error}
        onChange={(e) => { captcha.setAnswer(e.target.value); onType?.(); }} />
      {error ? <small className="err">{error}</small> : <small>Not case-sensitive. Can&rsquo;t read it? Get a new picture.</small>}
    </div>
  );
}
