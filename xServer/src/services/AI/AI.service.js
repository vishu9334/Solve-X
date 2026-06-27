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

Generate exactly ${count} unique, diverse, and dynamic MCQ questions. Avoid generic or repetitive questions. Ensure coverage of different areas under this topic.

Rules:
- Return only valid JSON.
- No markdown.
- No extra text.
- Each question must have exactly 4 options.
- correctAnswer must exactly match one value from options.
- CRITICAL: Each question object MUST use the key "questionText" for the question text. Do NOT use the key "question".
- Difficulty must always be "${difficulty}".
- Topic must be "${topic}".
- Estimate a dynamic "durationMinutes" (integer) for the entire test based on the complexity, reading difficulty, and time needed to solve the generated questions (give at least 1.5 - 2 minutes per question).

JSON structure:
${JSON.stringify(jsonSchemaExample)}
`;

  const userPrompt = `Generate ${count} unique and diverse ${difficulty} level MCQs for topic: ${topic}. Make sure they cover different sub-concepts and do not repeat similar questions.`;

  try {
    const response = await client.chat.complete({
      model: AiConfig.MISTRAL_MODEL,
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

    const mcqData = JSON.parse(cleaned.trim());
    if (!Array.isArray(mcqData.questions)) {
      throw new Error("Invalid MCQ response format");
    }

    // Defensive mapping to normalize keys and ensure absolute frontend compatibility
    mcqData.questions = mcqData.questions.map((q) => ({
      questionText: q.questionText || q.question || "",
      options: q.options || q.choices || [],
      correctAnswer: q.correctAnswer || q.correct_answer || q.answer || "",
      explanation: q.explanation || q.reason || "",
      difficulty: q.difficulty || difficulty,
      topic: q.topic || topic,
    }));

    if (!mcqData.durationMinutes) {
      mcqData.durationMinutes = Math.max(10, count * 2);
    }

    return mcqData;
  } catch (error) {
    console.error(`[AI.service] AI MCQ generation failed:`, error);
    throw error;
  }
}


export async function generateEmailContent({ type, userName, score, specializationName, reason }) {
  const name = specializationName || "Selected Specialization";
  let prompt = "";
  if (type === "pass") {
    prompt = `Write a professional and congratulatory email to mentor candidate ${userName} who has passed the Solve-X skill assessment for "${name}" with a score of ${score}%. Let them know their profile is now verified.`;
  } else if (type === "fail") {
    prompt = `Write an encouraging but firm email to mentor candidate ${userName} who did not pass the Solve-X skill assessment for "${name}" (Score: ${score}%). Encourage them to study and try again, keeping in mind the max attempt limits.`;
  } else if (type === "auto_submit") {
    prompt = `Write a formal warning email to mentor candidate ${userName} whose Solve-X skill assessment session for "${name}" was auto-submitted due to suspicious proctoring activity (warnings or violations: ${reason}). Explain that their assessment was terminated and submitted automatically.`;
  }

  try {
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
  } catch (error) {
    console.warn(`[AI.service] AI Email generation failed (${error.message}). Using local fallback email.`);
    
    let subject = "Solve-X Assessment Status Update";
    let body = `<p>Hello ${userName},</p>`;
    
    if (type === "pass") {
      subject = `Congratulations! You passed the Solve-X assessment for ${name}`;
      body += `<p>We are pleased to inform you that you have passed the skill assessment for <strong>${name}</strong> with a score of <strong>${score}%</strong>. Your profile has been successfully verified. You can now accept student doubts.</p>`;
    } else if (type === "fail") {
      subject = `Solve-X Assessment Results: ${name}`;
      body += `<p>Thank you for taking the skill assessment for <strong>${name}</strong>. Unfortunately, you did not pass (Score: <strong>${score}%</strong>). You can prepare and select the skill again to try when you are ready.</p>`;
    } else if (type === "auto_submit") {
      subject = `Solve-X Assessment Terminated: ${name}`;
      body += `<p>Your assessment session for <strong>${name}</strong> has been automatically terminated and submitted due to suspicious proctoring activity: <strong>${reason}</strong>.</p>`;
    }
    
    body += `<br/><p>Best regards,<br/>The Solve-X Team</p>`;
    return { subject, body };
  }
}

export async function classifyAndNormalizeSkill(inputSkillName, existingData) {
  const { specializations = [], catalogs = [] } = existingData;

  const systemPrompt = `
You are an expert AI Classifier and Synonym Resolver.

Your task is to classify a skill name input by a user and map it dynamically.
You are given a list of existing specializations (sub-categories) and catalog sections (main categories).

Existing Specializations (Sub-Categories):
${JSON.stringify(specializations.map(s => ({ id: s._id, name: s.name })))}

Existing Catalogs (Main Categories):
${JSON.stringify(catalogs.map(c => c.name))}

Rules:
1. Determine if the input skill is a synonym, abbreviation, or slight spelling variation of an existing specialization.
   - Example: "reactjs", "react developer", "react-js" are synonyms of "React JS".
   - Example: "nodejs", "node developer" are synonyms of "Node JS".
   - If a synonym match is found:
     - Set "isMatch" to true.
     - Set "matchedSpecializationId" to the exact string ID of that specialization.
     - Set "matchedSpecializationName" to the exact name of that specialization.
     - Set "mainCategory" to the catalog/main category it belongs to (e.g. "Frontend" for React JS).
2. If no synonym match is found:
   - Set "isMatch" to false.
   - Set "normalizedSpecializationName" to a professionally formatted Title Case version of the skill (e.g., "Vue JS", "Anatomy", "Pediatrics").
   - Classify what the "mainCategory" (parent domain) should be for this new skill. Look at existing catalogs first (e.g. "Frontend" or "Backend"). If it belongs to a completely different domain (like medical subjects, e.g. "Anatomy"), generate a suitable main category title (e.g., "MBBS" or "Medical Sciences").
3. Return only valid JSON. No markdown. No extra text.

JSON structure:
{
  "isMatch": boolean,
  "matchedSpecializationId": "string" (only if isMatch is true),
  "matchedSpecializationName": "string" (only if isMatch is true),
  "normalizedSpecializationName": "string" (only if isMatch is false),
  "mainCategory": "string" (e.g. "Frontend", "Backend", "MBBS", etc.)
}
`;

  const userPrompt = `Classify and normalize this input skill: "${inputSkillName}"`;

  try {
    const response = await client.chat.complete({
      model: AiConfig.MISTRAL_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("AI returned empty response");
    }

    let cleaned = rawContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }

    const decision = JSON.parse(cleaned.trim());
    return {
      isMatch: !!decision.isMatch,
      matchedSpecializationId: decision.matchedSpecializationId || null,
      matchedSpecializationName: decision.matchedSpecializationName || null,
      normalizedSpecializationName: decision.normalizedSpecializationName || inputSkillName,
      mainCategory: decision.mainCategory ? decision.mainCategory.trim() : "General"
    };
  } catch (error) {
    console.error("[AI.service] classifyAndNormalizeSkill failed, falling back:", error);
    // Safe local fallback (simple case-insensitive match on name)
    const normalizedInput = inputSkillName.trim();
    const match = specializations.find(s => s.name.toLowerCase() === normalizedInput.toLowerCase());
    if (match) {
      // Find main category of this match
      let mainCategory = "General";
      const cat = catalogs.find(c => c.specializationIds.some(id => id.toString() === match._id.toString()));
      if (cat) mainCategory = cat.name;

      return {
        isMatch: true,
        matchedSpecializationId: match._id.toString(),
        matchedSpecializationName: match.name,
        mainCategory
      };
    }

    return {
      isMatch: false,
      normalizedSpecializationName: normalizedInput,
      mainCategory: "General"
    };
  }
}