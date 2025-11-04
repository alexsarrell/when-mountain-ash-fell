import { z } from "zod";
import { STAT_DEFINITIONS, StatKey } from "../data/game.content";

export const CharacterStatsSchema = z.object(
  Object.fromEntries(
    Object.keys(STAT_DEFINITIONS).map((key) => {
      const stat = STAT_DEFINITIONS[key as StatKey];
      return [key, z.number().describe(stat.label)];
    }),
  ),
) as z.ZodObject<{
  [K in StatKey]: z.ZodNumber;
}>;

export const ItemSchemaLite = z.object({ id: z.string(), name: z.string() });

export const CharacterEquipmentSchema = z
  .object({
    weapon1: ItemSchemaLite.optional()
      .nullable()
      .describe("Оружие в правой руке"),
    weapon2: ItemSchemaLite.optional()
      .nullable()
      .describe("Оружие в левой руке"),
    armor: ItemSchemaLite.optional().nullable().describe("Броня"),
    helmet: ItemSchemaLite.optional().nullable().describe("Шлем"),
    belt: ItemSchemaLite.optional().nullable().describe("Ремень"),
    necklace: ItemSchemaLite.optional().nullable().describe("Медальон"),
    ring1: ItemSchemaLite.optional()
      .nullable()
      .describe("Кольцо на правой руке"),
    ring2: ItemSchemaLite.optional()
      .nullable()
      .describe("Кольцо на левой руке"),
    boots: ItemSchemaLite.optional().nullable().describe("Ботинки"),
    gloves: ItemSchemaLite.optional().nullable().describe("Перчатки"),
    legs: ItemSchemaLite.optional().nullable().describe("Штаны"),
  })
  .describe("Экипировка персонажа");

export const CharacterEquipmentIdsSchema = z
  .object({
    weapon1: z.string().optional().nullable(),
    weapon2: z.string().optional().nullable(),
    armor: z.string().optional().nullable(),
    helmet: z.string().optional().nullable(),
    belt: z.string().optional().nullable(),
    necklace: z.string().optional().nullable(),
    ring1: z.string().optional().nullable(),
    ring2: z.string().optional().nullable(),
    boots: z.string().optional().nullable(),
    gloves: z.string().optional().nullable(),
    legs: z.string().optional().nullable(),
  })
  .describe("ID экипированных предметов");
