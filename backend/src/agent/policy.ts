import { prisma } from "../db/prisma";

export async function getPolicy() {
  let policy = await prisma.policy.findUnique({ where: { id: "singleton" } });
  if (!policy) {
    policy = await prisma.policy.create({ data: { id: "singleton" } });
  }
  return policy;
}

export async function getMonthlyPayoutTotal(): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const payouts = await prisma.payout.findMany({
    where: { createdAt: { gte: start } },
  });
  return payouts.reduce((sum, p) => sum + p.amountUsdc, 0);
}
