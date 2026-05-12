import { createRequestHandler } from "@fastify/vercel";
import { app } from "../dist/index.js";

export default createRequestHandler(app);
