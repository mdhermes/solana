import DodoPayments from "dodopayments";

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment: "test_mode",
});
