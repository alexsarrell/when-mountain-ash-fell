import { z } from "zod";
import {
  CharacterStatsSchema,
  CharacterEquipmentSchema,
} from "./character.schema";
import { ItemSchema } from "./item.schema";
import { CLASSES, RACES } from "../data/game.content";

export const NPCSchema = z
  .object({
    characterName: z.string(),
    age: z.number(),
    race: z.enum(RACES.map((race) => race.id) as [string, ...string[]]),
    sex: z.enum(["MALE", "FEMALE"]),
    class: z.enum(CLASSES.map((clazz) => clazz.id) as [string, ...string[]]),
    level: z.number(),
    stats: CharacterStatsSchema,
    inventory: z.array(ItemSchema),
    equipment: CharacterEquipmentSchema,
    appearance: z.string(),
    attitude: z.number().describe("Отношение к игроку"),
  })
  .describe("NPC описание для StoryResponse: race/class — ID, не объекты");
