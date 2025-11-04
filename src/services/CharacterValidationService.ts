import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatCompletionService } from "./ChatCompletionService";
import { CharacterEquipmentSchema } from "../schemas/character.schema";
import { ItemSchema } from "../schemas/item.schema";
import { PROMPT_CONFIGURATION } from "../config/PromptProperties";

const ValidationResultSchema = z.object({
  appearance: z
    .string()
    .describe(
      "Очищенное описание внешности персонажа без упоминания одежды и предметов",
    ),
  equipment: CharacterEquipmentSchema.describe("Экипированные предметы"),
  inventory: z.array(ItemSchema).describe("Предметы в инвентаре"),
  rejectedItems: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string(),
      }),
    )
    .describe(
      "Предметы, которые были отклонены из-за несоответствия балансу игры",
    ),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export class CharacterValidationService {
  constructor(
    private chat: ChatCompletionService,
    private model: string = process.env.OPENAI_MODEL || "gpt-4o-mini",
  ) {}

  async validateAndParseCharacter(
    appearance: string,
    inventoryText: string,
  ): Promise<ValidationResult> {
    const prompt = PROMPT_CONFIGURATION.prompt.characterValidator
      .replace("{{ appearance }}", appearance)
      .replace("{{ inventory_text }}", inventoryText);

    const validationSchemaRaw = zodToJsonSchema(ValidationResultSchema, {
      name: "ValidationResult",
      $refStrategy: "none",
    });
    const validationSchema = { ...validationSchemaRaw }.definitions;

    if (!validationSchema) {
      throw new Error("Validation schema is undefined");
    }

    const response = await this.chat.send({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ValidationResult",
          schema: validationSchema.ValidationResult,
          strict: false,
        },
      },
      temperature: 0.7,
    });

    const parsed = ValidationResultSchema.safeParse(JSON.parse(response));
    if (!parsed.success) {
      throw new Error(
        "Invalid validation response format: " + parsed.error.message,
      );
    }
    return parsed.data;
  }
}
