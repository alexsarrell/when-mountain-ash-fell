import { z } from "zod";
import { ItemSchemaLite } from "./character.schema";

export const EquipmentSlotEnum = z.enum([
  "weapon1",
  "weapon2",
  "armor",
  "helmet",
  "belt",
  "necklace",
  "ring1",
  "ring2",
  "boots",
  "gloves",
]);

export const ItemStatsSchema = z.object({
  damage: z.number().optional(),
  defense: z.number().optional(),
  health: z.number().optional(),
  mana: z.number().optional(),
  strength: z.number().optional(),
  intelligence: z.number().optional(),
  agility: z.number().optional(),
  charisma: z.number().optional(),
  attractiveness: z.number().optional(),
  stealth: z.number().optional(),
  perception: z.number().optional(),
});

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().describe(`
    Тип предмета
  `),
  description: z.string().describe(`
    Описание предмета
  `),
  stats: ItemStatsSchema.nullable().optional().describe(`
    Стат-бонусы от предмета
  `),
  equipSlots: z.array(EquipmentSlotEnum).describe(`
    Массив слотов экипировки, в которые можно вставить предмет.
    Например: ["weapon1"] для двуручного меча, ["weapon1", "weapon2"] для кинжала или одноручного меча, ["weapon1", "weapon2"] для щита великана и т.д.
  `),
});

export const ItemStateSchema = z.object({
  itemsFound: z.array(ItemSchema).optional().describe(`
        В случае, если действие игрока привело к получению нового предмета, проставляй здесь его схему
    `),
  itemsLost: z.array(ItemSchemaLite).optional().describe(`
        В случае, если действие игрока привело к потере предмета, проставляй его схему здесь
    `),
});
