const AUTH_WORKER = "http://localhost:8787";

export async function onRequest(context: EventContext<unknown, string, unknown>) {
  const url = new URL(context.request.url);
  const target = `${AUTH_WORKER}${url.pathname}${url.search}`;

  return fetch(target, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });
}
