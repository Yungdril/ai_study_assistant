const Groq = require("groq-sdk");
const env = require("./config/env");

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

async function checkModels() {
  try {
    const models = await groq.models.list();

    console.log("\nAvailable Groq models:\n");

    for (const model of models.data) {
      console.log(model.id);
    }
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

checkModels();