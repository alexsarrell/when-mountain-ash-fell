import mongoose, { Schema, model } from 'mongoose'
import { z } from 'zod'
import { generateRawSchema } from 'zod-to-mongoose'
import { HeroSchema as HeroZod } from '../schemas/hero.schema'

type HeroDB = z.infer<typeof HeroZod>

const heroDef = generateRawSchema({ schema: HeroZod })
const HeroMongooseSchema = new Schema<HeroDB>(heroDef as any, { timestamps: true, collection: 'heroes' })

export const HeroModel = mongoose.models.Hero || model<HeroDB>('Hero', HeroMongooseSchema)
