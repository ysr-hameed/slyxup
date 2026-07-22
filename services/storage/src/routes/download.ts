import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { StorageEnv } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: StorageEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/download/:key",
  summary: "Download a file from R2",
  tags: ["Storage"],
  responses: {
    200: { description: "File content" },
    404: { description: "File not found" },
  },
});

route.openapi(routeDef, async (c) => {
  const key = c.req.param("key");
  const object = await c.env.R2.get(key);

  if (!object) {
    return c.json({ success: false, error: "File not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  logger.info("file_downloaded", { key, size: object.size });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Length": String(object.size),
      "ETag": object.httpEtag,
    },
  });
});

export default route;
