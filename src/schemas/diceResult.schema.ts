import { z } from "zod";

export const DiceResultSchema = z.object({
  input: z.string(),
  result: z.number(),
  details: z.string(),
});
