import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { StorageEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: StorageEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/download",
  summary: "Download a file from R2 by key",
  tags: ["Storage"],
  request: {
    query: z.object({ key: z.string() }),
  },
  responses: {
    200: { description: "File content" },
    404: {
      content: { "application/json": { schema: apiResponseSchema(z.any()) } },
      description: "File not found",
    },
  },
});

route.openapi(routeDef, async (c) => {
  const { key } = c.req.valid("query");
  const object = await c.env.R2.get(key);

  if (!object) {
    return c.json({ success: false, error: "File not found" }, 404);
  }

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
