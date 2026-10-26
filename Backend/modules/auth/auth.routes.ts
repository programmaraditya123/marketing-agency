import type { FastifyInstance } from "fastify";
import type { Environment } from "../../config/env";
import type { AuthService } from "./auth.helper";
import { authControllers } from "./auth.controller";
export default async function authRoutes(app: FastifyInstance, options: { auth: AuthService; env: Environment }) {
  const controller = authControllers(options.auth, options.env);
  const properties = { email: { type: "string", minLength: 3, maxLength: 254, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
    password: { type: "string", minLength: 12, maxLength: 128 }, name: { type: "string", minLength: 1, maxLength: 80, pattern: "\\S" } };
  for (const mode of ["register", "login"] as const) app.post(`/${mode}`, {
    schema: { body: { type: "object", additionalProperties: false, required: mode === "register" ? ["email", "password", "name"] : ["email", "password"], properties } },
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
  }, controller[mode]);
  app.get("/me", controller.me);
  app.post("/logout", controller.logout);
}
