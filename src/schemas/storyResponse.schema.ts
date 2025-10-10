import { z } from 'zod'
import { ItemStateSchema } from './item.schema'
import { NPCSchema } from './npc.schema'

export const StoryResponseSchema = z.object({
  type: z.enum(['event']).describe(`
      в случае, если действие игрока повело за собой какое-то событие 
      (например, игрок сделал бросок на восприятие и ему выпало нужное число на 
      кубике - и заметил капканы-ловушки, замаскированные в полу), или в любом 
      другом случае, где действие игрока влечёт за собой событие, возвращай event`),
  narrative: z.string(),
  location: z.string().describe(`
      Локация, в которой в данный момент находится игрок
  `),
  locationDescription: z.string().describe(`
      Описание локации, в которой находится игрок
  `),
  NPCs: z.array(NPCSchema).describe(`
      Если на локации есть NPC, предоставь информацию о них в своём ответе
  `),
  isNewLocation: z.boolean().describe(`
      Проставляй true в случае, если с последним действием игрока произошла смена локации. Иначе - false
  `),
  effect: z.array(z.string()).optional().describe(`
      Эффекты события - например урон здоровью, или повышение какого-то стата в случае, например, выпитого зелья или проведённого ритуала
  `),
  itemState: ItemStateSchema.optional().describe(`
      В случае, если действие игрока привело к получению или потере предметов, проставляй эту схему
  `),
  equipmentChanged: z.boolean().optional().describe(`
      В случае, если действие игрока привело к смене обмундирования (например он взял в руки меч вместо лука или надел другую броню) проставляй здесь true
  `),
}).strict()
