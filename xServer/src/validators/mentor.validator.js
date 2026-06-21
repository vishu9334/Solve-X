import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const submitAssessmentValidator = {
  params: z.object({
    attemptId: objectIdSchema,
  }),
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().trim().min(1, "questionId is required"),
        selectedAnswer: z.string().trim().min(1, "selectedAnswer is required"),
      })
    ).min(1, "answers array cannot be empty"),
  }),
};

export const selectSkillValidator = {
  body: z
    .object({
      skillId: objectIdSchema.optional(),
      skillName: z.string().trim().min(1, "skillName cannot be empty").optional(),
    })
    .refine(
      (data) => data.skillId || data.skillName,
      { message: "Either skillId or skillName is required" }
    ),
};

export const replyToDoubtValidator = {
  body: z.object({
    doubtSessionId: objectIdSchema,
    price: z.number({ required_error: "price is required" }).positive("price must be a positive number"),
    availableTime: z.string().trim().min(1, "availableTime is required"),
  }),
};

export const updateSkillDescriptionValidator = {
  body: z.object({
    description: z.string().trim().min(1, "description is required"),
  }),
};
