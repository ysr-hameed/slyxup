// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setupOpenApi(app: any, config: {
  title: string;
  version: string;
  serverUrl: string;
  serverDescription: string;
  pathPrefix?: string;
}) {
  const prefix = config.pathPrefix ?? "";
  app.doc(`${prefix}/openapi.json`, {
    openapi: "3.0.0",
    info: { title: config.title, version: config.version },
    servers: [{ url: config.serverUrl, description: config.serverDescription }],
  });
}
