import "dotenv/config";
import { execSync } from "child_process";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerWebhooks } from "./dodo/webhooks";
import { registerDashboardRoutes } from "./routes/dashboard";

// Ensure DB schema is up-to-date on every start
try {
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  console.log("DB schema applied successfully");
} catch (e) {
  console.error("DB schema push failed, starting anyway:", e);
}

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

// Security headers
app.addHook("onSend", async (_request, reply, payload) => {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("Referrer-Policy", "no-referrer");
  reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  reply.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.devnet.solana.com",
  );
  return payload;
});

// Not-found handler — no stack traces leaked
app.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({ error: "Not Found", message: "The requested resource does not exist" });
});

// Error handler — catches all unhandled errors safely
app.setErrorHandler((error: any, _request, reply) => {
  app.log.error(error);
  const status = error.statusCode || 500;
  reply.status(status).send({
    error: status >= 500 ? "Internal Server Error" : error.message,
    message: status >= 500 ? "Something went wrong" : error.message,
  });
});

registerWebhooks(app);
registerDashboardRoutes(app);

// Health check — used by Render and external monitoring
app.get("/health", async (_request, _reply) => {
  const uptime = process.uptime();
  return {
    status: "ok",
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
  };
});

app.listen(
  { port: Number(process.env.PORT) || 3000, host: "0.0.0.0" },
  (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  },
);
