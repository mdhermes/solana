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

registerWebhooks(app);
registerDashboardRoutes(app);

app.get("/health", async () => ({ status: "ok" }));

app.listen(
  { port: Number(process.env.PORT) || 3000, host: "0.0.0.0" },
  (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  },
);
