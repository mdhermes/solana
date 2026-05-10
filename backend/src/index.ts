import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerWebhooks } from "./dodo/webhooks";
import { registerDashboardRoutes } from "./routes/dashboard";

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
