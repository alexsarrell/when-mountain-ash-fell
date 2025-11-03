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

const ItemSchemaLite = z.object({ id: z.string(), name: z.string() });

export const CharacterEquipmentSchema = z
  .object({
    weapon1: ItemSchemaLite.describe("Оружие в правой руке"),
    weapon2: ItemSchemaLite.describe("Оружие в левой руке"),
    armor: ItemSchemaLite.describe("Броня"),
    helmet: ItemSchemaLite.describe("Шлем"),
    belt: ItemSchemaLite.describe("Ремень"),
    necklace: ItemSchemaLite.describe("Медальон"),
    ring1: ItemSchemaLite.describe("Кольцо на правой руке"),
    ring2: ItemSchemaLite.describe("Кольцо на левой руке"),
    boots: ItemSchemaLite.describe("Ботинки"),
    gloves: ItemSchemaLite.describe("Перчатки"),
  })
  .describe("Экипировка персонажа");
