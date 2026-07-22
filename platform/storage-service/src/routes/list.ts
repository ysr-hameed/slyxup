import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { StorageEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";

const route = new OpenAPIHono<{ Bindings: StorageEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/list",
  summary: "List files with optional prefix",
  tags: ["Storage"],
  request: { query: z.object({ prefix: z.string().optional(), limit: z.string().optional() }) },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } }, description: "List of files" },
  },
});

route.openapi(routeDef, async (c) => {
  const { prefix, limit } = c.req.valid("query");
  const options: R2ListOptions = {};
  if (prefix) options.prefix = prefix;
  if (limit) options.limit = parseInt(limit);

  const listing = await c.env.R2.list(options);
  const files = listing.objects.map((obj) => ({ key: obj.key, size: obj.size, etag: obj.etag, uploaded: obj.uploaded }));
  return c.json({ success: true, data: files });
});

export default route;
