import { z } from 'zod'
import {STAT_DEFINITIONS, StatKey} from "../data/game.content";

export const CharacterStatsSchema = z.object(
    Object.fromEntries(
        Object.keys(STAT_DEFINITIONS).map((key) => {
            const stat = STAT_DEFINITIONS[key as StatKey]
            return [
                key,
                z.number()
                    .describe(stat.label)
            ]
        })
    )
) as z.ZodObject<{
    [K in StatKey]: z.ZodNumber
}>

export const CharacterEquipmentSchema = z.object({
  weapon: z.string().optional(),
  armor: z.string().optional(),
  helmet: z.string().optional(),
}).describe('Экипировка персонажа')
