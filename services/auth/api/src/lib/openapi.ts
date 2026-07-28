const spec = {
  openapi: "3.1.0",
  info: {
    title: "SlyxAuth API",
    version: "0.1.0",
    description: "Authentication and application management API for SlyxUp",
  },
  servers: [{ url: "http://localhost:8787", description: "Development" }],
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        tags: ["Health"],
        responses: { "200": { description: "Service is healthy" } },
      },
    },
    "/api/auth/sign-up/email": {
      post: {
        summary: "Sign up with email and password",
        tags: ["Auth"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User created and signed in" },
          "400": { description: "Invalid input" },
        },
      },
    },
    "/api/auth/sign-in/email": {
      post: {
        summary: "Sign in with email and password",
        tags: ["Auth"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Signed in successfully" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/sign-out": {
      post: {
        summary: "Sign out current session",
        tags: ["Auth"],
        responses: { "200": { description: "Signed out" } },
      },
    },
    "/api/auth/get-session": {
      get: {
        summary: "Get current session",
        tags: ["Auth"],
        responses: {
          "200": { description: "Session data" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/applications": {
      get: {
        summary: "List applications",
        tags: ["Applications"],
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "List of applications" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create an application",
        tags: ["Applications"],
        security: [{ sessionCookie: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "slug"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 64 },
                  slug: { type: "string", pattern: "^[a-z0-9-]+$" },
                  domain: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Application created" },
          "400": { description: "Invalid input" },
          "401": { description: "Unauthorized" },
          "409": { description: "Slug already taken" },
        },
      },
    },
    "/api/applications/{id}": {
      get: {
        summary: "Get application by ID",
        tags: ["Applications"],
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Application data" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        summary: "Delete an application",
        tags: ["Applications"],
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Application deleted" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/applications/{id}/reveal-secret": {
      post: {
        summary: "Reveal application secret key",
        tags: ["Applications"],
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Secret key revealed" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        summary: "List all users (admin)",
        tags: ["Admin"],
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "List of users" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/admin/users/{id}": {
      get: {
        summary: "Get user by ID (admin)",
        tags: ["Admin"],
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "User data" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/admin/sessions": {
      get: {
        summary: "List all sessions (admin)",
        tags: ["Admin"],
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "List of sessions" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/admin/audit-logs": {
      get: {
        summary: "List audit logs (admin)",
        tags: ["Admin"],
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": { description: "List of audit logs" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth-session",
      },
    },
  },
};

export { spec };
