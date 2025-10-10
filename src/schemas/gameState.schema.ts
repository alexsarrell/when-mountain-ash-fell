import { z } from 'zod'
import { LocationSchema } from './location.schema'

export const GameHistoryEntrySchema = z.object({
  action: z.string(),
  response: z.string(),
  timestamp: z.date(),
})

export const GameStateSchema = z.object({
  characterId: z.string(),
  currentLocation: LocationSchema,
  history: z.array(GameHistoryEntrySchema),
})

export type GameState = z.infer<typeof GameStateSchema>
