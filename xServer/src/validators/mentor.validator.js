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

export const selectSpecializationValidator = {
  body: z
    .object({
      specializationId: objectIdSchema.optional(),
      specializationName: z.string().trim().min(1, "specializationName cannot be empty").optional(),
    })
    .refine(
      (data) => data.specializationId || data.specializationName,
      { message: "Either specializationId or specializationName is required" }
    ),
};

export const replyToDoubtValidator = {
  body: z.object({
    doubtSessionId: objectIdSchema,
    price: z.number({ required_error: "price is required" }).positive("price must be a positive number"),
    availableTime: z.string().trim().optional(),
    sessionType: z.enum(["instant", "scheduled"]).optional(),
    scheduledTime: z.string().trim().optional(),
  }),
};

export const updateSpecializationDescriptionValidator = {
  body: z.object({
    description: z.string().trim().min(1, "description is required"),
  }),
};

export const rejectScheduledDoubtValidator = {
  params: z.object({
    doubtSessionId: objectIdSchema,
  }),
  body: z.object({
    reason: z.string({ required_error: "reason is required" }).trim().min(5, "reason must be at least 5 characters long"),
  }),
};
