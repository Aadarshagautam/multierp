const backendBaseUrl = (import.meta.env?.VITE_BACKEND_URL || "http://localhost:5001").replace(
  /\/+$/,
  ""
);

const createRandomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const clientSessionId = `web-${createRandomId()}`;
let monitoringStarted = false;

export const getClientSessionId = () => clientSessionId;

export const createClientRequestId = () => `req-${createRandomId()}`;

export const reportBrowserEvent = async ({
  level = "error",
  message,
  stack,
  page,
  metadata,
} = {}) => {
  if (!message) {
    return;
  }

  const payload = JSON.stringify({
    level,
    message,
    clientSessionId,
    stack: typeof stack === "string" ? stack : null,
    page: page || (typeof window !== "undefined" ? window.location.pathname : null),
    metadata: metadata && typeof metadata === "object" ? metadata : null,
  });
  const url = `${backendBaseUrl}/api/ops/frontend-events`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Session-Id": clientSessionId,
        "X-Request-Id": createClientRequestId(),
      },
      body: payload,
      keepalive: true,
      credentials: "include",
    });
  } catch (error) {
    console.error("Monitoring request failed", error);
  }
};

export const initClientMonitoring = () => {
  if (monitoringStarted || typeof window === "undefined") {
    return;
  }

  monitoringStarted = true;

  window.addEventListener("error", (event) => {
    reportBrowserEvent({
      level: "error",
      message: event.message || "Unhandled browser error",
      stack: event.error?.stack,
      metadata: {
        source: event.filename || null,
        line: event.lineno || null,
        column: event.colno || null,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportBrowserEvent({
      level: "error",
      message: reason?.message || "Unhandled promise rejection",
      stack: reason?.stack,
    });
  });
};
