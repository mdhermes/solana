import { dodo } from "./client";
import { v4 as uuidv4 } from "uuid";

export async function logAgentAction(
  customerId: string,
  eventName: string,
  metadata: Record<string, string | number>,
) {
  // TODO: verify exact ingest endpoint signature against docs.dodopayments.com
  try {
    await (dodo as any).events.ingest({
      events: [
        {
          event_id: uuidv4(),
          customer_id: customerId,
          event_name: eventName,
          timestamp: new Date().toISOString(),
          metadata,
        },
      ],
    });
  } catch (error) {
    console.error("Failed to log agent action to Dodo:", error);
    // Continue anyway - logging failure shouldn't block main flow
  }
}
