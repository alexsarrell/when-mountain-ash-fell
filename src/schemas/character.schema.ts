import { z } from 'zod'
import {STAT_DEFINITIONS, StatKey} from "../data/game.content";

export const CharacterStatsSchema = z.object(
    Object.fromEntries(
        Object.keys(STAT_DEFINITIONS).map((key) => {
            const stat = STAT_DEFINITIONS[key as StatKey]
            return [
                key,
                z.number().describe(stat.label)
            ]
        })
    )
) as z.ZodObject<{
    [K in StatKey]: z.ZodNumber
}>

export const CharacterEquipmentSchema = z.object({
  weapon1:  z.string().optional().describe("Оружие в правой руке"),
  weapon2:  z.string().optional().describe("Оружие в левой руке"),
  armor:    z.string().optional().describe("Броня"),
  helmet:   z.string().optional().describe("Шлем"),

  belt:     z.string().optional().describe("Ремень"),
  necklace: z.string().optional().describe("Медальон"),
  ring1:    z.string().optional().describe("Кольцо на правой руке"),
  ring2:    z.string().optional().describe("Кольцо на левой руке"),
  boots:    z.string().optional().describe("Ботинки"),
  gloves:   z.string().optional().describe("Перчатки"),
}).describe('Экипировка персонажа')
