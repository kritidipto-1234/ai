import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const history = [
    {
      role: "user",
      parts: [{ text: "Hello tell me about ai" }],
    },
    {
      role: "model",
      parts: [{ text: "Ai is great and" }],
    },
  ];
async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config:{
      systemInstruction: "Always say hello sir, response shd have 2 fields  greeting , content",
      responseMimeType: "application/json"
    }
  });

  const response1 = await chat.sendMessage({
    message: "and....?",
  });
  console.log("Chat response 1:", JSON.parse(response1.text),chat.getHistory());

  // const response2 = await chat.sendMessage({
  //   message: "How many paws are in my house?",
  // });
  // console.log("Chat response 2:", response2.text);
}



async function main2() {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: "Hello tell me about ai" }],
      },
      {
        role: "model",
        parts: [{ text: "Ai is great and" }],
      },
      {
        role: "user",
        parts: [{ text: "and....?" }],
      }
    ],
    config:{
      systemInstruction: "Always say hello sir, response shd have 2 fields  greeting , content",
      responseMimeType: "application/json"
    }
  });
  console.log(JSON.parse(response.text), response.history);
}
await main2();