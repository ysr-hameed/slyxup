const PAYMENT_WORKER = "http://localhost:8788";

export async function onRequest(context: EventContext<unknown, string, unknown>) {
  const url = new URL(context.request.url);
  const target = `${PAYMENT_WORKER}${url.pathname}${url.search}`;

  return fetch(target, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });
}
