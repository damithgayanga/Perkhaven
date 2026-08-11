export type AppRole =
  | "Admin"
  | "Chairman"
  | "Managing Director"
  | "Hostel Warden"
  | "Staff"
  | "Student";

export type AuthenticatedUser = {
  email: string;
  role: AppRole;
  name: string;
};

type TokenSet = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
};

const tokenKey = "perkhaven-auth";
const verifierKey = "perkhaven-oauth-verifier";
const stateKey = "perkhaven-oauth-state";
const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "";
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

const roleNames: Record<string, AppRole> = {
  ADMIN: "Admin",
  CHAIRMAN: "Chairman",
  MANAGING_DIRECTOR: "Managing Director",
  WARDEN: "Hostel Warden",
  STAFF: "Staff",
  STUDENT: "Student",
};

function requireConfiguration() {
  if (!cognitoDomain || !clientId) {
    throw new Error("Production authentication has not been configured.");
  }
}

function base64Url(bytes: Uint8Array) {
  let value = "";
  bytes.forEach((byte) => (value += String.fromCharCode(byte)));
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function randomValue(length = 48) {
  return base64Url(crypto.getRandomValues(new Uint8Array(length)));
}

async function challengeFor(verifier: string) {
  return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
}

function decodeClaims(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("The identity token is invalid.");
  const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
  return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
}

function readTokens(): TokenSet | null {
  try {
    const tokens = JSON.parse(sessionStorage.getItem(tokenKey) || "null") as TokenSet | null;
    if (!tokens || tokens.expiresAt <= Date.now()) {
      sessionStorage.removeItem(tokenKey);
      return null;
    }
    return tokens;
  } catch {
    sessionStorage.removeItem(tokenKey);
    return null;
  }
}

function userFrom(tokens: TokenSet): AuthenticatedUser {
  const claims = decodeClaims(tokens.idToken);
  const groups = Array.isArray(claims["cognito:groups"])
    ? (claims["cognito:groups"] as string[])
    : [];
  const role = groups.map((group) => roleNames[group]).find(Boolean);
  if (!role) throw new Error("Your account does not have a Perkhaven role assigned.");
  const email = typeof claims.email === "string" ? claims.email : "";
  const name = typeof claims.name === "string" && claims.name.trim() ? claims.name : email;
  return { email, name, role };
}

export async function startSignIn() {
  requireConfiguration();
  const verifier = randomValue();
  const state = randomValue(24);
  sessionStorage.setItem(verifierKey, verifier);
  sessionStorage.setItem(stateKey, state);
  const query = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: `${location.origin}/`,
    state,
    code_challenge_method: "S256",
    code_challenge: await challengeFor(verifier),
  });
  location.assign(`${cognitoDomain}/oauth2/authorize?${query}`);
}

export async function completeSignIn(): Promise<AuthenticatedUser | null> {
  requireConfiguration();
  const query = new URLSearchParams(location.search);
  const oauthError = query.get("error_description") || query.get("error");
  if (oauthError) throw new Error(oauthError);

  const code = query.get("code");
  if (code) {
    const verifier = sessionStorage.getItem(verifierKey);
    const expectedState = sessionStorage.getItem(stateKey);
    if (!verifier || !expectedState || query.get("state") !== expectedState) {
      throw new Error("The sign-in response could not be verified. Please try again.");
    }
    const response = await fetch(`${cognitoDomain}/oauth2/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        redirect_uri: `${location.origin}/`,
        code_verifier: verifier,
      }),
    });
    if (!response.ok) throw new Error("Cognito could not complete sign-in. Please try again.");
    const payload = await response.json();
    const tokens: TokenSet = {
      accessToken: payload.access_token,
      idToken: payload.id_token,
      refreshToken: payload.refresh_token,
      expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    };
    sessionStorage.setItem(tokenKey, JSON.stringify(tokens));
    sessionStorage.removeItem(verifierKey);
    sessionStorage.removeItem(stateKey);
    history.replaceState({}, "", `${location.pathname}${location.hash}`);
    return userFrom(tokens);
  }

  const tokens = readTokens();
  return tokens ? userFrom(tokens) : null;
}

export function installAuthenticatedFetch() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const rawUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(rawUrl, location.origin);
    const tokens = readTokens();
    if (tokens && url.origin === location.origin && url.pathname.startsWith("/api/")) {
      const headers = new Headers(input instanceof Request ? input.headers : init.headers);
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
  return () => {
    window.fetch = originalFetch;
  };
}

export function signOut() {
  sessionStorage.removeItem(tokenKey);
  if (!cognitoDomain || !clientId) {
    location.assign("/");
    return;
  }
  const query = new URLSearchParams({ client_id: clientId, logout_uri: `${location.origin}/` });
  location.assign(`${cognitoDomain}/logout?${query}`);
}
