import express from "express";
import dotenv from "dotenv";
import path from "path";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

dotenv.config();

const port = 3000;
const app = express();
const __dirname = path.resolve();

app.use(express.json());

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY,
  maxOutputTokens: 2048,
});

const getMenuTool = new DynamicStructuredTool({
  name: "getMenuTool",
  description:
    "Return today's menu for a given category (breakfast, lunch, or dinner).",
  schema: z.object({
    category: z
      .string()
      .describe("Type of food. Example: breakfast, lunch, dinner"),
  }),
  func: async ({ category }) => {
    const menus = {
      breakfast:
        "Aloo paratha with yogurt and pickle, Masala Chai, Poha with peanuts, Omelette with toast",
      lunch:
        "Butter chicken with naan, Paneer tikka masala with rice, Dal makhani with roti, Curd rice with pickle",
      dinner:
        "Biryani with raita, Chole bhature, Vegetable pulao with salad, Tandoori chicken with naan",
    };
    return `Today's ${category} menu is: ${
      menus[category.toLowerCase()] || "Menu not found for the given category."
    }`;
  },
});

const tools = [getMenuTool];
const agentExecutor = await createReactAgent({ llm: model, tools });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const userInput = req.body.input;
  console.log("UserInput:", userInput);

  try {
    const result = await agentExecutor.invoke({
      messages: [{ role: "user", content: userInput }],
    });

    console.log("Agent full Response:", result);

    const outputMessage =
      result.output ||
      result.messages?.[result.messages.length - 1]?.content ||
      "Sorry, I couldn't generate a response.";

    res.json({ output: outputMessage });
  } catch (err) {
    console.error("Error during agent execution:", err);
    res
      .status(500)
      .json({ output: "Sorry, something went wrong. Please try again." });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});

