"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type User = { name: string; email: string; picture: string; sub: string };

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const USER_KEY = "ccp:user";

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(part)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function GoogleSignIn() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  // hydrate stored user
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const onCredential = useCallback((resp: { credential?: string }) => {
    if (!resp?.credential) return;
    const p = decodeJwt(resp.credential);
    if (!p) return;
    const u: User = {
      name: String(p.name ?? ""),
      email: String(p.email ?? ""),
      picture: String(p.picture ?? ""),
      sub: String(p.sub ?? ""),
    };
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
    setUser(u);
    window.dispatchEvent(new Event("ccp:user-changed"));
  }, []);

  // load Google Identity Services + render button when signed out
  useEffect(() => {
    if (!CLIENT_ID || !ready || user) return;
    const SCRIPT_ID = "gis-client";

    function init() {
      const g = (window as unknown as { google?: any }).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({ client_id: CLIENT_ID, callback: onCredential });
      if (btnRef.current) {
        btnRef.current.innerHTML = "";
        g.accounts.id.renderButton(btnRef.current, {
          type: "standard",
          theme: "outline",
          size: "medium",
          text: "signin_with",
          shape: "pill",
        });
      }
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      init();
    } else {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = init;
      document.body.appendChild(s);
    }
  }, [ready, user, onCredential]);

  function signOut() {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    try {
      (window as unknown as { google?: any }).google?.accounts?.id?.disableAutoSelect?.();
    } catch {
      /* ignore */
    }
    setUser(null);
    window.dispatchEvent(new Event("ccp:user-changed"));
  }

  // Not configured yet → render nothing (app works fine without sign-in).
  if (!CLIENT_ID || !ready) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.picture}
            alt=""
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-full border border-[var(--border)]"
          />
        ) : null}
        <span className="hidden sm:inline text-sm">
          {user.name?.split(" ")[0] || "Signed in"}
        </span>
        <button
          onClick={signOut}
          className="text-xs text-[var(--muted)] hover:text-[var(--fg)]"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <div ref={btnRef} aria-label="Sign in with Google" />;
}
