import { z } from "zod";
import { prisma } from "../db/prisma";
import { sendUsdc } from "../solana/transfer";
import { logAgentAction } from "../dodo/events";
import { loadOrCreateWallet } from "../solana/wallet";
import { getPolicy, getMonthlyPayoutTotal } from "./policy";


const wallet = loadOrCreateWallet();

/** Shared client — use singleton */
let _geminiClient: GeminiClient | null = null;
function getClient(): GeminiClient {
  if (!_geminiClient) _geminiClient = new GeminiClient();
  return _geminiClient;
}

/**
 * Minimal OpenAI-compatible client for Gemini.
 * Bypasses LangChain's broken openai package integration.
 */
class GeminiClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "";
    this.baseUrl =
      process.env.OPENAI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta/openai/";
    this.model = "gemini-2.5-flash";
  }

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    const url = `${this.baseUrl.replace(/\/+$/, "")}/chat/completions`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 1024,
        temperature: 0,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "no body");
      throw new Error(`Gemini API error (${res.status}): ${text.slice(0, 300)}`);
    }

    const data = await res.json() as { choices?: { message?: { content?: string }[] } };
    return data.choices?.[0]?.message?.content || "";
  }
}

/** Get affiliates with pending amounts above the payout threshold */
async function getAffiliates() {
  const policy = await getPolicy();
  return prisma.affiliate.findMany({
    where: { pendingAmount: { gte: policy.payoutThresholdUsd } },
  });
}

/** Evaluate affiliates and decide payouts */
async function decidePayouts(): Promise<string> {
  const policy = await getPolicy();
  const affiliates = await getAffiliates();

  if (affiliates.length === 0) {
    return "No affiliates have pending amounts above the payout threshold.";
  }

  const monthlyTotal = await getMonthlyPayoutTotal();
  const results: string[] = [];

  for (const a of affiliates) {
    if (a.pendingAmount < policy.payoutThresholdUsd) {
      results.push(
        `SKIPPED ${a.name}: $${a.pendingAmount} pending is below $${policy.payoutThresholdUsd} threshold.`
      );
      continue;
    }

    if (monthlyTotal + a.pendingAmount > policy.maxMonthlyPayoutUsd) {
      results.push(
        `BLOCKED ${a.name}: Monthly cap of $${policy.maxMonthlyPayoutUsd} would be exceeded.`
      );
      continue;
    }

    // Execute payout
    try {
      const txHash = await sendUsdc(wallet, a.solanaWallet, a.pendingAmount);

      await prisma.payout.create({
        data: {
          affiliateId: a.id,
          amountUsdc: a.pendingAmount,
          solanaTxHash: txHash,
          dodoEventId: `payout_${Date.now()}`,
        },
      });

      await prisma.affiliate.update({
        where: { id: a.id },
        data: {
          totalPaid: { increment: a.pendingAmount },
          pendingAmount: { decrement: a.pendingAmount },
        },
      });

      await prisma.agentAction.create({
        data: {
          type: "payout",
          description: `Paid ${a.name} $${a.pendingAmount} USDC. TX: ${txHash}`,
          metadata: JSON.stringify({
            affiliateId: a.id,
            amountUsdc: a.pendingAmount,
            txHash,
          }),
        },
      });

      results.push(`PAID ${a.name}: $${a.pendingAmount} USDC → TX: ${txHash}`);
    } catch (err: any) {
      results.push(
        `FAILED ${a.name}: $${a.pendingAmount} — ${err.message.slice(0, 150)}`
      );
    }
  }

  return results.join("\n");
}

/**
 * Run the agent autonomously.
 * Takes a prompt, uses Gemini to decide, executes payouts.
 */
export async function runAgent(input: string): Promise<string> {
  // For automated triggers from webhooks, use the prompt for context
  // but let the deterministic payout logic handle decisions
  const client = getClient();
  const systemPrompt = `You are RevShare Agent — an autonomous AI CFO for Indian SaaS founders.
You operate within strict policy guardrails set by the founder.
Your job is to evaluate payout requests and respond with a decision.

Respond with "PROCEED" if the request seems reasonable for automatic processing.
Respond with "SKIP: <reason>" if it should not be processed right now.
Respond with "INFO: <summary>" if you're just acknowledging information.`;

  const response = await client.chat([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Context: ${input}\n\nEvaluate if I should process payouts for qualifying affiliates.`,
    },
  ]);

  // Run the actual decision logic regardless of what the LLM says
  // (we trust the policy engine, not the LLM for financial decisions)
  const payoutResult = await decidePayouts();
  return payoutResult;
}
