import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma";
import { getUsdcBalance, loadOrCreateWallet } from "../solana/wallet";
import { runAgent } from "../agent/brain";

export async function registerDashboardRoutes(app: FastifyInstance) {
  const wallet = loadOrCreateWallet();

  app.get("/api/dashboard", async () => {
    const [actions, affiliates, payouts, balance] = await Promise.all([
      prisma.agentAction.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.affiliate.findMany(),
      prisma.payout.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      getUsdcBalance(wallet.publicKey),
    ]);

    return {
      walletAddress: wallet.publicKey.toBase58(),
      usdcBalance: balance,
      actions,
      affiliates,
      payouts,
    };
  });

  app.get("/api/policy", async () => {
    return prisma.policy.findUnique({ where: { id: "singleton" } });
  });

  app.put("/api/policy", async (request) => {
    const body = request.body as any;
    return prisma.policy.upsert({
      where: { id: "singleton" },
      update: body,
      create: { id: "singleton", ...body },
    });
  });

  // Seed mock affiliates for demo
  app.post("/api/seed", async () => {
    await prisma.affiliate.createMany({
      data: [
        {
          name: "Alice Sharma",
          email: "alice@example.com",
          solanaWallet: "REPLACE_WITH_REAL_DEVNET_WALLET_1",
          pendingAmount: 75,
        },
        {
          name: "Bob Mehta",
          email: "bob@example.com",
          solanaWallet: "REPLACE_WITH_REAL_DEVNET_WALLET_2",
          pendingAmount: 30,
        },
      ],
    });
    return { seeded: true };
  });

  // Manual agent trigger for demo
  app.post("/api/agent/run", async () => {
    const result = await runAgent(
      "Check all affiliates with pending payouts above the threshold and pay them. Also check for any subscriptions needing upgrades.",
    );
    return { result };
  });
}
