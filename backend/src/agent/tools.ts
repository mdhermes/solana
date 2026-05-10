import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { dodo } from "../dodo/client";
import { sendUsdc } from "../solana/transfer";
import { logAgentAction } from "../dodo/events";
import { loadOrCreateWallet } from "../solana/wallet";
import { getPolicy, getMonthlyPayoutTotal } from "./policy";

const wallet = loadOrCreateWallet();

export const payAffiliateTool = new DynamicStructuredTool({
  name: "pay_affiliate",
  description:
    "Pay an affiliate their earned commission in USDC on Solana when they hit the payout threshold",
  schema: z.object({
    affiliateId: z.string(),
    amountUsdc: z.number(),
    reason: z.string(),
  }),
  func: async ({ affiliateId, amountUsdc, reason }) => {
    const policy = await getPolicy();
    const monthlyTotal = await getMonthlyPayoutTotal();

    if (monthlyTotal + amountUsdc > policy.maxMonthlyPayoutUsd) {
      return `BLOCKED: Monthly payout cap of $${policy.maxMonthlyPayoutUsd} would be exceeded`;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });
    if (!affiliate) return `ERROR: Affiliate ${affiliateId} not found`;
    if (amountUsdc < policy.payoutThresholdUsd) {
      return `SKIPPED: Amount $${amountUsdc} below threshold $${policy.payoutThresholdUsd}`;
    }

    const txHash = await sendUsdc(wallet, affiliate.solanaWallet, amountUsdc);

    await prisma.payout.create({
      data: {
        affiliateId,
        amountUsdc,
        solanaTxHash: txHash,
        dodoEventId: `payout_${Date.now()}`,
      },
    });

    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        totalPaid: { increment: amountUsdc },
        pendingAmount: { decrement: amountUsdc },
      },
    });

    // TODO: verify customer_id mapping — affiliates need corresponding Dodo customer IDs
    await logAgentAction("affiliate_customer_id", "affiliate.payout", {
      affiliate_id: affiliateId,
      amount_usdc: amountUsdc,
      solana_tx: txHash,
      reason,
    });

    await prisma.agentAction.create({
      data: {
        type: "payout",
        description: `Paid ${affiliate.name} $${amountUsdc} USDC. Reason: ${reason}`,
        metadata: JSON.stringify({ txHash, affiliateId, amountUsdc }),
      },
    });

    return `SUCCESS: Paid $${amountUsdc} USDC to ${affiliate.name}. TX: ${txHash}`;
  },
});

export const upgradeSubscriptionTool = new DynamicStructuredTool({
  name: "upgrade_subscription",
  description:
    "Upgrade a customer subscription when they exceed their plan limits",
  schema: z.object({
    subscriptionId: z.string(),
    newProductId: z.string(),
    reason: z.string(),
  }),
  func: async ({ subscriptionId, newProductId, reason }) => {
    // TODO: verify PUT /subscriptions/{id} payload against docs.dodopayments.com
    try {
      await (dodo as any).subscriptions.update(subscriptionId, {
        product_id: newProductId,
      });
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
    }

    await prisma.agentAction.create({
      data: {
        type: "plan_upgrade",
        description: `Upgraded subscription ${subscriptionId} to ${newProductId}. Reason: ${reason}`,
        metadata: JSON.stringify({ subscriptionId, newProductId }),
      },
    });

    return `SUCCESS: Upgraded subscription ${subscriptionId}`;
  },
});

export const issueCreditTool = new DynamicStructuredTool({
  name: "issue_credit",
  description: "Issue credits to a customer for complaints or overages",
  schema: z.object({
    customerId: z.string(),
    entitlementId: z.string(),
    amount: z.number(),
    reason: z.string(),
  }),
  func: async ({ customerId, entitlementId, amount, reason }) => {
    // TODO: verify ledger entry endpoint against docs.dodopayments.com
    try {
      await (dodo as any).creditEntitlements.createLedgerEntry(entitlementId, {
        customer_id: customerId,
        amount,
        entry_type: "credit",
      });
    } catch (error) {
      console.error("Failed to issue credit:", error);
    }

    await prisma.agentAction.create({
      data: {
        type: "credit_issued",
        description: `Issued ${amount} credits to customer ${customerId}. Reason: ${reason}`,
        metadata: JSON.stringify({ customerId, amount }),
      },
    });

    return `SUCCESS: Issued ${amount} credits to ${customerId}`;
  },
});

export const getAffiliatesTool = new DynamicStructuredTool({
  name: "get_affiliates_pending_payout",
  description:
    "Get all affiliates with pending amounts above the payout threshold",
  schema: z.object({}),
  func: async () => {
    const policy = await getPolicy();
    const affiliates = await prisma.affiliate.findMany({
      where: { pendingAmount: { gte: policy.payoutThresholdUsd } },
    });
    return JSON.stringify(affiliates);
  },
});
