import { Hero, Location, StoryResponse } from "../types";
import {
  ChatCompletionService,
  ChatRequestParams,
} from "../services/ChatCompletionService";
import { PROMPT_CONFIGURATION } from "../config/PromptProperties";

export class PromptAgent {
  private readonly model: string;
  private readonly chat: ChatCompletionService;

  constructor(model: string, chat: ChatCompletionService) {
    this.model = model;
    this.chat = chat;
  }

  createCharacterPrompt(character: Hero): string {
    const notEquipped = "не надето";

    const fields = [
      [
        "Оружие в правой руке",
        character?.equipment?.weapon1 && character.equipment.weapon1.trim()
          ? character.equipment.weapon1
          : notEquipped,
      ],
      [
        "Оружие в левой руке",
        character?.equipment?.weapon2 && character.equipment.weapon2.trim()
          ? character.equipment.weapon2
          : notEquipped,
      ],
      [
        "Броня",
        character?.equipment?.armor && character.equipment.armor.trim()
          ? character.equipment.armor
          : notEquipped,
      ],
      [
        "Шлем",
        character?.equipment?.helmet && character.equipment.helmet.trim()
          ? character.equipment.helmet
          : notEquipped,
      ],
      [
        "Ремень",
        character?.equipment?.belt && character.equipment.belt.trim()
          ? character.equipment.belt
          : notEquipped,
      ],
      [
        "Медальон",
        character?.equipment?.necklace && character.equipment.necklace.trim()
          ? character.equipment.necklace
          : notEquipped,
      ],
      [
        "Кольцо на правой руке",
        character?.equipment?.ring1 && character.equipment.ring1.trim()
          ? character.equipment.ring1
          : notEquipped,
      ],
      [
        "Кольцо на левой руке",
        character?.equipment?.ring2 && character.equipment.ring2.trim()
          ? character.equipment.ring2
          : notEquipped,
      ],
      [
        "Ботинки",
        character?.equipment?.boots && character.equipment.boots.trim()
          ? character.equipment.boots
          : notEquipped,
      ],
      [
        "Перчатки",
        character?.equipment?.gloves && character.equipment.gloves.trim()
          ? character.equipment.gloves
          : notEquipped,
      ],
    ];

    const result = fields
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n");

    return PROMPT_CONFIGURATION.prompt.character
      .replace("{{ character_name }}", character.characterName)
      .replace("{{ character_race }}", character.race.name)
      .replace("{{ character_class }}", character.class.name)
      .replace("{{ character_sex }}", character.sex.toString())
      .replace("{{ character_age }}", character.age.toString())
      .replace("{{ character_appearance }}", character.appearance)
      .replace("{{ character_stats }}", JSON.stringify(character.stats))
      .replace("{{ character_equipment }}", JSON.stringify(result));
  }

  toCharacterImagePrompt(prompt: string): string {
    return PROMPT_CONFIGURATION.prompt.characterImage.replace(
      "{{ character_description }}",
      prompt,
    );
  }

  async createLocationPrompt(
    hero: Hero,
    location: Location,
    storyResponse: StoryResponse,
  ): Promise<string> {
    const characters = location.NPCs.map((npc) => ({
      age: npc.age,
      race: npc.race,
      sex: npc.sex,
      equipment: npc.equipment,
      appearance: npc.appearance,
    }));

    const prompt = PROMPT_CONFIGURATION.prompt.prompter
      .replace("{{ location_name }}", location.name)
      .replace("{{ location_description }}", location.description)
      .replace("{{ characters_on_location }}", JSON.stringify(characters))
      .replace("{{ hero_appearance }}", hero.appearance)
      .replace("{{ narrative }}", storyResponse.narrative);

    const params: ChatRequestParams = {
      model: this.model,
      messages: [{ role: "system", content: prompt }],
      temperature: 1,
    } as ChatRequestParams;

    return this.chat.send(params);
  }
}
