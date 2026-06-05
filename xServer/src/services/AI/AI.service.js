import AiConfig from '../../configs/config.js'

import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: AiConfig.AI_API_KEY,
});

export async function generateMCQ(topic, difficulty = "Medium", count = 5) {
  const jsonSchemaExample = {
    questions: [
      {
        questionText: "The question text or code snippet",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Exact string from options array",
        explanation: "Short explanation",
        difficulty: difficulty,
        topic: topic,
      },
    ],
  };

  const systemPrompt = `
You are an expert technical interviewer.

Generate exactly ${count} MCQ questions.

Rules:
- Return only valid JSON.
- No markdown.
- No extra text.
- Each question must have exactly 4 options.
- correctAnswer must exactly match one value from options.
- Difficulty must always be "${difficulty}".
- Topic must be "${topic}".

JSON structure:
${JSON.stringify(jsonSchemaExample)}
`;

  const userPrompt = `Generate ${count} ${difficulty} level MCQs for topic: ${topic}`;

  const response = await client.chat.complete({
    model:AiConfig.MISTRAL_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],

    // Official API name is response_format.
    // If your installed SDK only accepts camelCase, use responseFormat.
    response_format: {
      type: "json_object",
    },

    temperature: 0.2,
  });

  const rawContent = response.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("AI returned empty response");
  }

  const mcqData = JSON.parse(rawContent);

  if (!Array.isArray(mcqData.questions)) {
    throw new Error("Invalid MCQ response format");
  }

  return mcqData;
}