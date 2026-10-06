import { z } from "zod";
import { API_PREFIX, type RouteDef } from "./router";

/**
 * Builds an OpenAPI 3.1 description of the API straight from the route table,
 * so it cannot drift from the code. Request bodies come from the same zod
 * schemas the handlers validate with. Served at `GET /api/v1/openapi.json`;
 * Postman, Swagger UI and client generators can all consume it.
 */

const toOpenApiPath = (path: string) =>
  path.replace(/:(\w+)/g, (_match, name: string) => `{${name}}`);

const operationId = (method: string, path: string) =>
  method.toLowerCase() +
  path
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith(":")
        ? "By" + segment[1].toUpperCase() + segment.slice(2)
        : segment
            .split("-")
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(""),
    )
    .join("");

const tagOf = (path: string) => {
  const parts = path.split("/").filter(Boolean);
  const segment = parts[0] === "ledgers" ? (parts[2] ?? "ledgers") : parts[0];
  return !segment || segment.startsWith(":") ? "ledgers" : segment;
};

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
});

export function buildOpenApi(routes: RouteDef[], port = 47821) {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of routes) {
    const openApiPath = toOpenApiPath(route.path);
    const pathParams = [...route.path.matchAll(/:(\w+)/g)].map((m) => ({
      name: m[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    }));
    const queryParams = Object.entries(route.query ?? {}).map(
      ([name, description]) => ({
        name,
        in: "query",
        required: false,
        description,
        schema: { type: "string" },
      }),
    );

    const operation: Record<string, unknown> = {
      operationId: operationId(route.method, route.path),
      summary: route.summary,
      tags: [tagOf(route.path)],
      parameters: [...pathParams, ...queryParams],
      responses: {
        [route.method === "DELETE"
          ? "204"
          : route.method === "POST"
            ? "201"
            : "200"]: {
          description:
            route.method === "DELETE"
              ? "Deleted"
              : "Success. JSON, or a file download for export endpoints and ?format=csv.",
        },
        "400": errorResponse("Validation error"),
        "401": errorResponse("Missing or invalid bearer token"),
        "404": errorResponse("Not found"),
        "409": errorResponse("Conflict"),
      },
    };

    if (route.body) {
      operation.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: z.toJSONSchema(route.body, {
              io: "input",
              unrepresentable: "any",
            }),
          },
        },
      };
    }
    (paths[openApiPath] ??= {})[route.method.toLowerCase()] = operation;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Vaulted Money Local API",
      version: "1.0.0",
      description:
        "Local REST API of the Vaulted Money desktop app. Enable it in Settings; it listens on 127.0.0.1 only and needs the access token shown there.",
    },
    servers: [{ url: `http://127.0.0.1:${port}${API_PREFIX}` }],
    security: [{ bearerAuth: [] }],
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
      schemas: {
        Error: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: {},
              },
            },
          },
        },
      },
    },
  };
}
