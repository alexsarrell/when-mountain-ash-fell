import { z } from "zod";
import {
  CharacterStatsSchema,
  CharacterEquipmentSchema,
  CharacterEquipmentIdsSchema,
} from "./character.schema";
import { ItemSchema } from "./item.schema";

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

export const HeroDBSchema = z.object({
  _id: z.string(),
  characterName: z.string(),
  age: z.number(),
  race: RaceSchema,
  sex: z.number(),
  class: GameClassSchema,
  level: z.number().optional().default(1),
  stats: CharacterStatsSchema,
  inventoryIds: z.array(z.string()).optional().default([]).describe("ID предметов в инвентаре"),
  equipmentIds: CharacterEquipmentIdsSchema.optional().default({}).describe("ID экипированных предметов"),
  appearance: z.string(),
  imageUrl: z.string().optional(),
  publicImageUrl: z.string().optional(),
  imageHash: z.string().optional(),
});

export const HeroSchema = z.object({
  _id: z.string(),
  characterName: z.string(),
  age: z.number(),
  race: RaceSchema,
  sex: z.number(),
  class: GameClassSchema,
  level: z.number().optional().default(1),
  stats: CharacterStatsSchema,
  inventory: z.array(ItemSchema).optional().default([]).describe("Полные объекты предметов в инвентаре"),
  equipment: CharacterEquipmentSchema.optional().default({}).describe("Полные объекты экипированных предметов"),
  appearance: z.string(),
  imageUrl: z.string().optional(),
  publicImageUrl: z.string().optional(),
  imageHash: z.string().optional(),
});

export type HeroDB = z.infer<typeof HeroDBSchema>;
export type Hero = z.infer<typeof HeroSchema>;
