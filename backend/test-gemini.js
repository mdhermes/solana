const { ChatOpenAI } = require("@langchain/openai");
const { execSync } = require("child_process");

// Get key from auth.json
const key = execSync(
  `python3 -c 'import json; d=json.load(open("/home/md/.hermes/auth.json")); [print(c["access_token"]) for c in d["credential_pool"]["gemini"] if c["label"] == "key2"]'`
)
  .toString()
  .trim();

console.log("Key length:", key.length);
console.log("Base URL:", process.env.OPENAI_BASE_URL);

const llm = new ChatOpenAI({
  modelName: "gemini-2.5-flash",
  temperature: 0,
  openAIApiKey: key,
  configuration: {
    baseURL:
      process.env.OPENAI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
});

llm
  .invoke("Say hello in one word")
  .then((r) => {
    console.log("SUCCESS:", r.content);
  })
  .catch((e) => {
    console.log("ERROR:", e.message);
    console.log("STATUS:", e.response?.status, e.response?.statusText);
    if (e.response?.data) {
      const chunks = [];
      e.response.data.on("data", (c) => chunks.push(c));
      e.response.data.on("end", () =>
        console.log("BODY:", Buffer.concat(chunks).toString().substring(0, 500))
      );
    }
  });
