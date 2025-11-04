import { GameState, Hero, StoryResponse } from "../types";
import { zodToJsonSchema } from "zod-to-json-schema";
import { StoryResponseSchema } from "../schemas/storyResponse.schema";
import { TOOLS, RollDiceToolCallSchema } from "../tools/tools";
import { PROMPT_CONFIGURATION } from "../config/PromptProperties";
import {
  ChatCompletionService,
  ChatRequestParams,
  ToolHandler,
} from "../services/ChatCompletionService";
import { extractJson } from "../utils/json";

import { DiceService } from "../services/DiceService";

export class StoryAgent {
  private readonly model: string;
  private readonly jsonMode: boolean;
  private readonly chat: ChatCompletionService;
  private readonly diceService = new DiceService();

  constructor(
    chat: ChatCompletionService,
    model = "just-ai/openai-proxy/gpt-4.1",
    jsonMode = true,
  ) {
    this.chat = chat;
    this.model = model;
    this.jsonMode = jsonMode;
  }

  async processAction(
    action: string,
    character: Hero,
    gameState: GameState,
    onDiceRoll?: (dice: string, count: number, result: number) => void,
  ): Promise<StoryResponse> {
    const prompt = PROMPT_CONFIGURATION.prompt.narrator
      .replace("{{ character_name }}", character.characterName)
      .replace("{{ character_race }}", character.race.name)
      .replace("{{ character_class }}", character.class.name)
      .replace("{{ character_age }}", character.age.toString())
      .replace("{{ character_appearance }}", character.appearance)
      .replace("{{ character_stats }}", JSON.stringify(character.stats))
      .replace("{{ location_name }}", gameState.currentLocation.name)
      .replace("{{ character_equipment }}", JSON.stringify(character.equipment))
      .replace(
        "{{ location_description }}",
        gameState.currentLocation.description,
      )
      .replace("{{ character_equipment }}", JSON.stringify(character.equipment))
      .replace(
        "{{ character_inventory }}",
        character.inventory.map((i) => i.name).join(", "),
      );

    const storySchemaRaw = zodToJsonSchema(StoryResponseSchema, {
      name: "StoryResponse",
      $refStrategy: "none",
    });
    const storySchema = { ...storySchemaRaw }.definitions;

    const history = gameState.history.flatMap((h) => [
      { role: "user", content: h.action },
      { role: "assistant", content: h.response },
    ]);

    const params: ChatRequestParams = {
      model: this.model,
      messages: [{ role: "system", content: prompt }]
        .concat(history)
        .concat({ role: "user", content: action }),
      temperature: 1,
      tools: [TOOLS.roll_dice],
      tool_choice: "auto",
    } as ChatRequestParams;

    if (this.jsonMode && storySchema) {
      params.response_format = {
        type: "json_schema",
        json_schema: {
          name: "StoryResponse",
          schema: storySchema.StoryResponse,
          strict: false,
        },
      };
    }

    const handler: ToolHandler = async (name, args) => {
      switch (name) {
        case "roll_dice": {
          const { dice_type, count } = RollDiceToolCallSchema.parse(args);
          const result = await this.diceService.throwDice(
            dice_type,
            count || 1,
          );
          if (onDiceRoll) {
            const diceString = await this.diceService.getDiceString(
              dice_type,
              1,
            );
            onDiceRoll(diceString, count || 1, result.result);
          }
          return result;
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    };

    const content = await this.chat.send(params, handler);
    const jsonText = extractJson(content || "{}");
    const parsed = StoryResponseSchema.safeParse(JSON.parse(jsonText));
    if (!parsed.success) {
      console.error("Validation errors:", JSON.stringify(parsed.error.errors, null, 2));
      throw new Error(`Invalid AI response format, response: ${jsonText}`);
    }
    return parsed.data as StoryResponse;
  }
}
