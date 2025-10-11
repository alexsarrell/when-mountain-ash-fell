import mongoose, { model } from 'mongoose'
import { z } from 'zod'
import { extendZod, zodSchema } from '@zodyac/zod-mongoose'
import { GameStateSchema as GameStateZod } from '../schemas/gameState.schema'

extendZod(z)

type GameStateDB = z.infer<typeof GameStateZod>

const GameStateMongooseSchema = zodSchema(GameStateZod)

export const GameStateModel = mongoose.models.GameState || model<GameStateDB>('GameState', GameStateMongooseSchema, 'gameState')
