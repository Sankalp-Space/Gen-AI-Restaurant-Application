import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {AgentExecutor, createToolCallingAgent} from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {z} from 'zod';

dotenv.config();


const  port = 3000;
const app = express();

const __dirname = path.resolve();

app.use(express.json());
const model = new ChatGoogleGenerativeAI({
    modelName: "models/gemini-2.5-flash",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_kEY,
    maxOutputTokens:2048,
});

const getMenuTool = new DynamicStructuredTool({
    name: "getMenuTool",
    description: "Return the final answer for today's menu for the given category (breakfast,lunch , or dinner). Use this  tool to directly answer the user's menu question.",
    schema: z.object({
        category:z.string().describe("Type of food. Example:breakfast, lunch, dinner")
    }),
    func:async ({category})=>{
        const menus ={
            breakfast: "Aloo paratha with yogurt and pickle, Masala Chai, Poha with peanuts, Ommelette with toast",
            lunch: "Butter chicken with naan, Paneer tikka masala with rice, Dal makhani with roti, Curd rice with pickle",
            dinner: "Biryani with raita, Chole bhature, Vegetable pulao with salad, Tandoori chicken with naan"
        };
        return `Today's ${category} menu is: ${menus[category.toLowerCase()] || "Menu not found for the given category."}`;
            
        },
});

const prompt= ChatPromptTemplate.fromMessages([
    ["system","You are a helpful restaurant menu assistant."],
    ["human","{input}"],
    ["ai","{agent_scratchpad}"]
]);

const agent=await createToolCallingAgent({
    llm:model,
    tools:[getMenuTool],
    prompt,
});

const executor= await AgentExecutor.fromAgentAndTools({
    agent,
    tools:[getMenuTool],
})


app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public','index.html'));
})


app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`)
});