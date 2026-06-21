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
  } catch (error) {
    console.warn(`[AI.service] AI MCQ generation failed (${error.message}). Using local fallback questions.`);
    
    // Determine topic-specific fallback questions
    let questions = [];
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes("mern") || lowerTopic.includes("node") || lowerTopic.includes("react")) {
      questions = [
        {
          questionText: "What does MERN stand for?",
          options: [
            "MongoDB, Express, React, Node",
            "MySQL, Express, Ruby, Node",
            "MongoDB, Express, Angular, Node",
            "MongoDB, Ember, React, Node"
          ],
          correctAnswer: "MongoDB, Express, React, Node",
          explanation: "MERN is an acronym for MongoDB, Express, React, Node.",
          difficulty,
          topic
        },
        {
          questionText: "Which database is used in the MERN stack?",
          options: ["PostgreSQL", "MongoDB", "MySQL", "Oracle"],
          correctAnswer: "MongoDB",
          explanation: "MongoDB is the document database of the MERN stack.",
          difficulty,
          topic
        },
        {
          questionText: "What is Express in the MERN stack?",
          options: ["A database", "A backend web framework", "A frontend framework", "A programming language"],
          correctAnswer: "A backend web framework",
          explanation: "Express is a minimal and flexible Node.js web application framework.",
          difficulty,
          topic
        },
        {
          questionText: "Which library is used to build user interfaces in MERN?",
          options: ["Angular", "React", "Vue", "Ember"],
          correctAnswer: "React",
          explanation: "React is a JavaScript library for building user interfaces.",
          difficulty,
          topic
        },
        {
          questionText: "What is Node.js?",
          options: [
            "A JavaScript library",
            "A JavaScript runtime built on Chrome's V8 engine",
            "A CSS framework",
            "A relational database"
          ],
          correctAnswer: "A JavaScript runtime built on Chrome's V8 engine",
          explanation: "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
          difficulty,
          topic
        }
      ];
    } else if (lowerTopic.includes("dsa") || lowerTopic.includes("data structure") || lowerTopic.includes("algorithm")) {
      questions = [
        {
          questionText: "What is the worst-case time complexity of quicksort?",
          options: ["O(n log n)", "O(n^2)", "O(n)", "O(1)"],
          correctAnswer: "O(n^2)",
          explanation: "Quicksort has O(n^2) worst-case time complexity when the partition process is unbalanced.",
          difficulty,
          topic
        },
        {
          questionText: "Which data structure operates on a LIFO basis?",
          options: ["Queue", "Stack", "Heap", "Tree"],
          correctAnswer: "Stack",
          explanation: "A Stack is a Last In First Out (LIFO) data structure.",
          difficulty,
          topic
        },
        {
          questionText: "What is the time complexity of searching in a Balanced Binary Search Tree?",
          options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
          correctAnswer: "O(log n)",
          explanation: "In a balanced BST, searching takes logarithmic time.",
          difficulty,
          topic
        },
        {
          questionText: "Which of the following is not a linear data structure?",
          options: ["Array", "Linked List", "Graph", "Queue"],
          correctAnswer: "Graph",
          explanation: "A graph is a non-linear data structure.",
          difficulty,
          topic
        },
        {
          questionText: "What is the time complexity to insert a node at the beginning of a singly linked list?",
          options: ["O(n)", "O(1)", "O(log n)", "O(n log n)"],
          correctAnswer: "O(1)",
          explanation: "Inserting at the beginning only requires updating pointers, which takes O(1) time.",
          difficulty,
          topic
        }
      ];
    } else {
      // General/System Design fallback questions
      questions = [
        {
          questionText: "Which of the following is used to distribute traffic across multiple servers?",
          options: ["Database router", "Load Balancer", "Web Proxy", "CDN"],
          correctAnswer: "Load Balancer",
          explanation: "A load balancer distributes incoming network traffic across multiple servers.",
          difficulty,
          topic
        },
        {
          questionText: "What is vertical scaling?",
          options: [
            "Adding more servers to the pool",
            "Adding more power (CPU, RAM) to an existing server",
            "Sharding the database",
            "Caching database queries"
          ],
          correctAnswer: "Adding more power (CPU, RAM) to an existing server",
          explanation: "Vertical scaling means increasing the capacity of a single server.",
          difficulty,
          topic
        },
        {
          questionText: "Which caching strategy writes data to both cache and database simultaneously?",
          options: ["Write-through", "Write-back", "Read-through", "Write-around"],
          correctAnswer: "Write-through",
          explanation: "Write-through caching updates both cache and DB synchronously.",
          difficulty,
          topic
        },
        {
          questionText: "What does CDN stand for?",
          options: ["Content Delivery Network", "Central Database Node", "Computer Data Network", "Client Delivery Network"],
          correctAnswer: "Content Delivery Network",
          explanation: "A CDN is a geographically distributed group of servers that speeds up web content delivery.",
          difficulty,
          topic
        },
        {
          questionText: "Which theorem states that a distributed data store can simultaneously provide at most two of: Consistency, Availability, and Partition tolerance?",
          options: ["CAP Theorem", "ACID Theorem", "BASE Theorem", "PACELC Theorem"],
          correctAnswer: "CAP Theorem",
          explanation: "The CAP Theorem states that you can only have two of Consistency, Availability, and Partition tolerance.",
          difficulty,
          topic
        }
      ];
    }

    return {
      durationMinutes: questions.length * 2,
      questions
    };
  }
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
      subject = `Congratulations! You passed the Solve-X assessment for ${skillName}`;
      body += `<p>We are pleased to inform you that you have passed the skill assessment for <strong>${skillName}</strong> with a score of <strong>${score}%</strong>. Your profile has been successfully verified. You can now accept student doubts.</p>`;
    } else if (type === "fail") {
      subject = `Solve-X Assessment Results: ${skillName}`;
      body += `<p>Thank you for taking the skill assessment for <strong>${skillName}</strong>. Unfortunately, you did not pass (Score: <strong>${score}%</strong>). You can prepare and select the skill again to try when you are ready.</p>`;
    } else if (type === "auto_submit") {
      subject = `Solve-X Assessment Terminated: ${skillName}`;
      body += `<p>Your assessment session for <strong>${skillName}</strong> has been automatically terminated and submitted due to suspicious proctoring activity: <strong>${reason}</strong>.</p>`;
    }
    
    body += `<br/><p>Best regards,<br/>The Solve-X Team</p>`;
    return { subject, body };
  }
}