import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { StorageEnv } from "@slyxup/shared";
import { apiResponseSchema, requireApiKey } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: StorageEnv }>();

route.use("/delete", requireApiKey);

const routeDef = createRoute({
  method: "delete",
  path: "/delete",
  summary: "Delete a file from R2",
  tags: ["Storage"],
  request: { query: z.object({ key: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "File deleted" },
    404: { description: "File not found" },
  },
});

route.openapi(routeDef, async (c) => {
  const { key } = c.req.valid("query");
  const object = await c.env.R2.head(key);
  if (!object) return c.json({ success: false, error: "File not found" }, 404);

  await c.env.R2.delete(key);
  logger.info("file_deleted", { key });
  return c.json({ success: true, data: { key } });
});

export default route;
