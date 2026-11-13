import { z } from "zod";

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.flattenError(parsed.error).fieldErrors,
      });
    }
    req.validatedBody = parsed.data;
    next();
  };
}
