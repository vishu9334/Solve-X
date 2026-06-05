import { ApiError } from "../utils/ApiError.js";

export const validate = (schemas = {}) => {
  return (req, res, next) => {
    const validationErrors = [];

    for (const [requestPart, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[requestPart] ?? {});

      if (!result.success) {
        validationErrors.push(
          ...result.error.issues.map((issue) => ({
            field: [requestPart, ...issue.path].join("."),
            message: issue.message,
          }))
        );
        continue;
      }

      if (requestPart === "query") {
        Object.defineProperty(req, "query", {
          value: result.data,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        req[requestPart] = result.data;
      }
    }

    if (validationErrors.length > 0) {
      return next(new ApiError(400, "Validation failed", validationErrors));
    }

    return next();
  };
};
