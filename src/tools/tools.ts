import OpenAI from "openai";
import { z } from "zod";
import { DiceEnum } from "../services/DiceService";

export const TOOLS: Record<string, OpenAI.Chat.ChatCompletionTool> = {
  roll_dice: {
    type: "function",
    function: {
      name: "roll_dice",
      description: "Бросает игральный кубик (d4, d6, d8, d10, d12, d20)",
      parameters: {
        type: "object",
        properties: {
          dice_type: {
            type: "string",
            enum: ["d4", "d6", "d8", "d10", "d12", "d20"],
            description: "Тип кубика для броска",
          },
          count: {
            type: "number",
            description: "Количество кубиков для броска",
            default: 1,
          },
        },
        required: ["dice_type"],
      },
    },
  },
};

export type ToolKey = keyof typeof TOOLS;
export type TOOL_DEFINITION = (typeof TOOLS)[ToolKey];

export const RollDiceToolCallSchema = z.object({
  dice_type: z.preprocess(
    (v) => (typeof v === "string" ? (DiceEnum as any)[v] : v),
    z.nativeEnum(DiceEnum),
  ),
  count: z.number().optional().default(1),
});
