import { auth } from './firebase';

export async function secureFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = "";
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === "object" && "url" in input) {
    url = (input as any).url || "";
  }

  // Intercept and inject token into any local /api/ requests
  if (url && (url.startsWith("/api/") || url.includes("/api/"))) {
    let token = "";

    // Retrieve the active Firebase Auth user's token
    if (auth?.currentUser) {
      try {
        const fbToken = await auth.currentUser.getIdToken();
        if (fbToken) {
          token = fbToken;
        }
      } catch (err) {
        console.warn("SecureFetch was unable to sign verification payload:", err);
      }
    }

    if (token) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
        init.headers = headers;
      }
    }
  }

  return fetch(input, init);
}
