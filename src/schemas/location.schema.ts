import { z } from "zod";
import { NPCSchema } from "./npc.schema";

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  NPCs: z.array(NPCSchema),
  locationImageUrl: z.string().optional(),
});
