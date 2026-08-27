import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

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
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
const region = process.env.NEXT_PUBLIC_AWS_REGION || "ap-south-1";
const cognito = new CognitoIdentityProviderClient({ region });

const roleNames: Record<string, AppRole> = {
  ADMIN: "Admin",
  CHAIRMAN: "Chairman",
  MANAGING_DIRECTOR: "Managing Director",
  WARDEN: "Hostel Warden",
  STAFF: "Staff",
  STUDENT: "Student",
};

function requireConfiguration() {
  if (!clientId) {
    throw new Error("Production authentication has not been configured.");
  }
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

export async function completeSignIn(): Promise<AuthenticatedUser | null> {
  requireConfiguration();
  const tokens = readTokens();
  return tokens ? userFrom(tokens) : null;
}

export type PasswordChallenge = { session: string; username: string };

function saveAuthentication(result: { AuthenticationResult?: { AccessToken?: string; IdToken?: string; RefreshToken?: string; ExpiresIn?: number } }) {
  const authentication = result.AuthenticationResult;
  if (!authentication?.AccessToken || !authentication.IdToken) throw new Error("Cognito did not return valid authentication tokens.");
  const tokens: TokenSet = {
    accessToken: authentication.AccessToken,
    idToken: authentication.IdToken,
    refreshToken: authentication.RefreshToken,
    expiresAt: Date.now() + Number(authentication.ExpiresIn || 3600) * 1000,
  };
  sessionStorage.setItem(tokenKey, JSON.stringify(tokens));
  return userFrom(tokens);
}

export async function signIn(username: string, password: string, challenge?: PasswordChallenge, newPassword?: string): Promise<{ user?: AuthenticatedUser; challenge?: PasswordChallenge }> {
  requireConfiguration();
  const result = challenge
    ? await cognito.send(new RespondToAuthChallengeCommand({
        ClientId: clientId,
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        Session: challenge.session,
        ChallengeResponses: { USERNAME: challenge.username, NEW_PASSWORD: newPassword || "" },
      }))
    : await cognito.send(new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: { USERNAME: username.trim(), PASSWORD: password },
      }));
  if (result.ChallengeName === "NEW_PASSWORD_REQUIRED" && result.Session) {
    return { challenge: { session: result.Session, username: username.trim() } };
  }
  return { user: saveAuthentication(result) };
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
  location.assign("/");
}
