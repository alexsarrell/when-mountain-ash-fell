import { z } from "zod";
import {
  CharacterStatsSchema,
  CharacterEquipmentSchema,
} from "./character.schema";

export const RaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  statBonuses: z.any(),
});
export const GameClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  baseStats: z.any(),
  startingItems: z.array(z.string()),
});

export const ItemSchemaLite = z.object({ id: z.string(), name: z.string() });

export const HeroSchema = z.object({
  _id: z.string(),
  characterName: z.string(),
  age: z.number(),
  race: RaceSchema,
  sex: z.number(),
  class: GameClassSchema,
  level: z.number().optional().default(1),
  stats: CharacterStatsSchema,
  inventory: z.array(ItemSchemaLite),
  equipment: CharacterEquipmentSchema.optional().default({}),
  appearance: z.string(),
  imageUrl: z.string().optional(),
  publicImageUrl: z.string().optional(),
  imageHash: z.string().optional(),
});

export type Hero = z.infer<typeof HeroSchema>;
