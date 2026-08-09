import { z } from "zod";

const officialUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  });

export const venueSuggestionSchema = z.object({
  lang: z.enum(["en", "pt", "es"]),
  name: z.string().trim().min(2).max(160),
  url: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    officialUrlSchema.optional(),
  ),
});

export type VenueSuggestion = z.infer<typeof venueSuggestionSchema>;
