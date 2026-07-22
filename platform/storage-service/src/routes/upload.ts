import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { StorageEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: StorageEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/upload",
  summary: "Upload a file to R2",
  tags: ["Storage"],
  request: { body: { content: { "multipart/form-data": { schema: z.object({ file: z.any(), key: z.string().optional() }) } } } },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ key: z.string(), url: z.string() })) } }, description: "File uploaded" },
    400: { description: "No file provided" },
  },
});

route.openapi(routeDef, async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"] as File | undefined;
  const key = (body["key"] as string) || `${Date.now()}-${file?.name}`;

  if (!file) return c.json({ success: false, error: "No file provided" }, 400);

  await c.env.R2.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const url = `${c.env.R2_PUBLIC_URL}/${key}`;
  logger.info("file_uploaded", { key, size: file.size, type: file.type });

  return c.json({ success: true, data: { key, url } });
});

export default route;
