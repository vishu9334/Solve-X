import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const submitAssessmentValidator = {
  body: z.object({
    attemptId: objectIdSchema,
    sessionId: objectIdSchema,
    answers: z.array(
      z.object({
        questionId: z.string().trim().min(1, "questionId is required"),
        selectedAnswer: z.string().trim().min(1, "selectedAnswer is required"),
      })
    ).min(1, "answers array cannot be empty"),
  }),
};
