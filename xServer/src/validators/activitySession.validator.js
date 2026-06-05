import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const activityEventTypes = [
  "FULLSCREEN_PROMPT_SHOWN",
  "FULLSCREEN_ENTERED",
  "FULLSCREEN_EXITED",
  "TAB_SWITCHED",
  "TAB_RETURNED",
  "WINDOW_BLUR",
  "WINDOW_FOCUS",
  "SCREEN_RESIZED",
  "PAGE_REFRESH",
  "PAGE_CLOSE",
  "TEST_STARTED",
  "TEST_SUBMITTED",
  "TIME_EXPIRED",
];

const screenSchema = z
  .object({
    innerWidth: z.number().nonnegative().nullable().optional(),
    innerHeight: z.number().nonnegative().nullable().optional(),
    outerWidth: z.number().nonnegative().nullable().optional(),
    outerHeight: z.number().nonnegative().nullable().optional(),
    screenWidth: z.number().nonnegative().nullable().optional(),
    screenHeight: z.number().nonnegative().nullable().optional(),
    availWidth: z.number().nonnegative().nullable().optional(),
    availHeight: z.number().nonnegative().nullable().optional(),
    isFullscreen: z.boolean().optional(),
    isTabHidden: z.boolean().optional(),
    hasFocus: z.boolean().optional(),
  })
  .optional()
  .default({});

const metadataSchema = z.record(z.string(), z.unknown()).optional().default({});

export const startActivitySessionValidator = {
  body: z.object({
    userId: objectIdSchema.optional(),
    category: z.string().trim().min(1, "category is required"),
    screen: screenSchema,
    metadata: metadataSchema,
  }),
};

export const recordActivityEventValidator = {
  params: z.object({
    sessionId: objectIdSchema,
  }),
  body: z.object({
    eventType: z.enum(activityEventTypes),
    message: z.string().trim().min(1).optional(),
    screen: screenSchema,
    metadata: metadataSchema,
    occurredAt: z.coerce.date().optional(),
  }),
};

export const submitActivitySessionValidator = {
  params: z.object({
    sessionId: objectIdSchema,
  }),
  body: z
    .object({
      message: z.string().trim().min(1).optional(),
      screen: screenSchema,
      metadata: metadataSchema,
      occurredAt: z.coerce.date().optional(),
    })
    .optional()
    .default({}),
};

export const sessionIdParamValidator = {
  params: z.object({
    sessionId: objectIdSchema,
  }),
};

export const userActivitySessionsValidator = {
  params: z.object({
    userId: objectIdSchema,
  }),
  query: z.object({
    category: z.string().trim().min(1).optional(),
  }),
};
