import AiConfig from '../../configs/config.js'

import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: AiConfig.AI_API_KEY,
});

export async function generateMCQ(topic, difficulty = "Medium") {
  const isDSA = topic.toLowerCase().includes("dsa") || topic.toLowerCase().includes("data structure");
  const count = isDSA ? 5 : 10;

  const jsonSchemaExample = {
    durationMinutes: 15,
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
- Estimate a dynamic "durationMinutes" (integer) for the entire test based on the complexity, reading difficulty, and time needed to solve the generated questions (give at least 1.5 - 2 minutes per question).

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

  let cleaned = rawContent.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
  }

  const mcqData = JSON.parse(cleaned.trim());

  if (!Array.isArray(mcqData.questions)) {
    throw new Error("Invalid MCQ response format");
  }

  return mcqData;
}


export async function generateEmailContent({ type, userName, score, skillName, reason }) {
  let prompt = "";
  if (type === "pass") {
    prompt = `Write a professional and congratulatory email to mentor candidate ${userName} who has passed the Solve-X skill assessment for "${skillName}" with a score of ${score}%. Let them know their profile is now verified.`;
  } else if (type === "fail") {
    prompt = `Write an encouraging but firm email to mentor candidate ${userName} who did not pass the Solve-X skill assessment for "${skillName}" (Score: ${score}%). Encourage them to study and try again, keeping in mind the max attempt limits.`;
  } else if (type === "auto_submit") {
    prompt = `Write a formal warning email to mentor candidate ${userName} whose Solve-X skill assessment session for "${skillName}" was auto-submitted due to suspicious proctoring activity (warnings or violations: ${reason}). Explain that their assessment was terminated and submitted automatically.`;
  }

  const response = await client.chat.complete({
    model: AiConfig.MISTRAL_MODEL,
    messages: [
      {
        role: "system",
        content: "You are the Solve-X Assessment System. Write a professional, concise email subject and body in HTML format. Return only JSON with subject and body keys.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
    temperature: 0.7,
  });

  const rawContent = response.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("AI returned empty response");
  }

  let cleaned = rawContent.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
  }

  return JSON.parse(cleaned.trim());
}