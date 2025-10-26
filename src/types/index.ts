import { z } from "zod";
import { RollDiceToolCallSchema } from "../tools/tools";
export enum CharacterSex {
  MALE,
  FEMALE,
}

export { ItemSchema, ItemStateSchema } from "../schemas/item.schema";
export { DiceResultSchema } from "../schemas/diceResult.schema";
export {
  CharacterStatsSchema,
  CharacterEquipmentSchema,
} from "../schemas/character.schema";
export { NPCSchema } from "../schemas/npc.schema";
export { StoryResponseSchema } from "../schemas/storyResponse.schema";
export { LocationSchema } from "../schemas/location.schema";
export {
  GameStateSchema,
  GameHistoryEntrySchema,
} from "../schemas/gameState.schema";
export {
  HeroSchema,
  RaceSchema,
  GameClassSchema,
} from "../schemas/hero.schema";

export type DiceResult = z.infer<
  typeof import("../schemas/diceResult.schema").DiceResultSchema
>;
export type RollDiceToolCall = z.infer<
  typeof import("../tools/tools").RollDiceToolCallSchema
>;
export type Item = z.infer<typeof import("../schemas/item.schema").ItemSchema>;
export type ItemState = z.infer<
  typeof import("../schemas/item.schema").ItemStateSchema
>;
export type CharacterStats = z.infer<
  typeof import("../schemas/character.schema").CharacterStatsSchema
>;
export type CharacterEquipment = z.infer<
  typeof import("../schemas/character.schema").CharacterEquipmentSchema
>;
export type NPCDto = z.infer<typeof import("../schemas/npc.schema").NPCSchema>;
export type StoryResponse = z.infer<
  typeof import("../schemas/storyResponse.schema").StoryResponseSchema
>;
export type Location = z.infer<
  typeof import("../schemas/location.schema").LocationSchema
>;
export type GameHistoryEntry = z.infer<
  typeof import("../schemas/gameState.schema").GameHistoryEntrySchema
>;
export type GameState = z.infer<
  typeof import("../schemas/gameState.schema").GameStateSchema
>;
export type Hero = z.infer<typeof import("../schemas/hero.schema").HeroSchema>;
