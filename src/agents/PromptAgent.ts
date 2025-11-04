import { Hero, Item, Location, StoryResponse } from "../types";
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
        character?.equipment?.weapon1?.name?.trim() || notEquipped,
      ],
      [
        "Оружие в левой руке",
        character?.equipment?.weapon2?.name?.trim() || notEquipped,
      ],
      ["Броня", character?.equipment?.armor?.name?.trim() || notEquipped],
      ["Шлем", character?.equipment?.helmet?.name?.trim() || notEquipped],
      ["Ремень", character?.equipment?.belt?.name?.trim() || notEquipped],
      ["Медальон", character?.equipment?.necklace?.name?.trim() || notEquipped],
      [
        "Кольцо на правой руке",
        character?.equipment?.ring1?.name?.trim() || notEquipped,
      ],
      [
        "Кольцо на левой руке",
        character?.equipment?.ring2?.name?.trim() || notEquipped,
      ],
      ["Штаны", character?.equipment?.legs?.name?.trim() || notEquipped],
      ["Ботинки", character?.equipment?.boots?.name?.trim() || notEquipped],
      ["Перчатки", character?.equipment?.gloves?.name?.trim() || notEquipped],
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

  characterImageRegenerationPromptByItems(
    character: Hero,
    equippedItemNames: Item[],
    unequippedItemNames: string[],
  ): string {
    const takeOffItemsNames = unequippedItemNames.join(", ");
    const takeOnItemsNames = equippedItemNames
      .map((i) => `${i.name}: ${i.description}`)
      .join(", ");

    return PROMPT_CONFIGURATION.prompt.characterImage
      .replace("{{ character_description }}", character.appearance)
      .replace("{{ take_off_items }}", takeOffItemsNames)
      .replace("{{ take_on_items }}", takeOnItemsNames);
  }

  async createLocationPrompt(
    hero: Hero,
    location: Location,
    playerAction: string,
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
      .replace("{{ narrative }}", storyResponse.narrative)
      .replace("{{ player_action }}", playerAction);

    const params: ChatRequestParams = {
      model: this.model,
      messages: [{ role: "system", content: prompt }],
      temperature: 1,
    } as ChatRequestParams;

    return this.chat.send(params);
  }
}
