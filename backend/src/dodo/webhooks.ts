import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma";
import { runAgent } from "../agent/brain";

export async function registerWebhooks(app: FastifyInstance) {
  app.post(
    "/webhooks/dodo",
    {
      config: { rawBody: true },
    },
    async (request, reply) => {
      // TODO: implement Dodo webhook signature verification
      // Reference: docs.dodopayments.com/webhooks
      const event = request.body as any;

      console.log("Dodo webhook received:", event.type);

      if (event.type === "payment.succeeded") {
        const payment = event.data;
        // Check if this payment is a referral — look at metadata
        const referrerId = payment.metadata?.referrer_id;
        if (referrerId) {
          const commission = payment.total_amount * 0.1; // 10% commission
          await prisma.affiliate.updateMany({
            where: { id: referrerId },
            data: { pendingAmount: { increment: commission / 100 } },
          });

          // Trigger agent to check if payout threshold is hit
          const agentResponse = await runAgent(
            `A new payment of $${payment.total_amount / 100} was received. 
           Affiliate ${referrerId} earned $${commission / 100} commission.
           Check if they are above the payout threshold and pay them if so.`,
          );
          console.log("Agent response:", agentResponse);
        }
      }

      if (event.type === "subscription.updated") {
        // Agent evaluates overage
        await runAgent(
          `Subscription ${event.data.subscription_id} was updated. 
         Customer ${event.data.customer?.customer_id} may have exceeded limits.
         Evaluate if an upgrade is warranted based on usage.`,
        );
      }

      reply.send({ received: true });
    },
  );
}
