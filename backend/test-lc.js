const { ChatOpenAI } = require("@langchain/openai");
const { execSync } = require("child_process");

const key = execSync(
  `python3 -c 'import json; d=json.load(open("/home/md/.hermes/auth.json")); [print(c["access_token"]) for c in d["credential_pool"]["gemini"] if c["label"] == "key2"]'`
).toString().trim();

// Patch fetch to log the request URL
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  console.log("FETCH URL:", url);
  console.log("METHOD:", opts?.method || "GET");
  console.log("HEADERS:", JSON.stringify(opts?.headers || {}));
  if (opts?.body) console.log("BODY:", opts.body.toString().substring(0, 500));
  return originalFetch(url, opts);
};

const llm = new ChatOpenAI({
  modelName: "gemini-2.5-flash",
  temperature: 0,
  openAIApiKey: key,
  configuration: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
});

llm.invoke("Say hello").then(r => console.log("OK:", r.content)).catch(e => console.log("ERROR:", e.message));
