import mongoose, { Schema, model } from 'mongoose'
import { z } from 'zod'
import { generateRawSchema } from 'zod-to-mongoose'
import { NPCSchema as NPCZod } from '../schemas/npc.schema'

type NPCDB = z.infer<typeof NPCZod>

const npcDef = generateRawSchema({ schema: NPCZod })
const NPCMongooseSchema = new Schema<NPCDB>(npcDef as any, { timestamps: true, collection: 'NPC' })

export const NPCModel = mongoose.models.NPC || model<NPCDB>('NPC', NPCMongooseSchema)
