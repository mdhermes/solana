import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  payAffiliateTool,
  upgradeSubscriptionTool,
  issueCreditTool,
  getAffiliatesTool,
} from "./tools";

const tools = [
  payAffiliateTool,
  upgradeSubscriptionTool,
  issueCreditTool,
  getAffiliatesTool,
];

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are RevShare Agent — an autonomous AI CFO for Indian SaaS founders.
You operate within strict policy guardrails set by the founder.
Your job is to:
1. Pay affiliates in USDC on Solana when they hit the payout threshold
2. Upgrade customer subscriptions when they exceed plan limits
3. Issue credits for complaints
4. Never exceed monthly payout caps
5. Always log a clear reason for every action

Be decisive. Do not ask for confirmation. Execute within policy bounds.`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
});

export async function runAgent(input: string): Promise<string> {
  const agent = await createOpenAIFunctionsAgent({ llm, tools, prompt });
  const executor = new AgentExecutor({ agent, tools, verbose: false });
  const result = await executor.invoke({ input, chat_history: [] });
  return result.output;
}
