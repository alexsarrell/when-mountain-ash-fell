import {Hero, Location, StoryResponse} from '../types';
import OpenAI from "openai";

export class PromptAgent {
    private openai: OpenAI;
    private model: string;

    constructor(model: string, apiKey: string, baseURL?: string) {
        this.model = model;
        this.openai = new OpenAI({apiKey, baseURL});
    }

  createCharacterPrompt(character: Hero): string {
      const notEquipped = 'не надето'

      const fields = [
          ['Оружие в правой руке', character?.equipment?.weapon1 ?? notEquipped],
          ['Оружие в левой руке', character?.equipment?.weapon2 ?? notEquipped],
          ['Броня', character?.equipment?.armor ?? notEquipped],
          ['Шлем', character?.equipment?.helmet ?? notEquipped],
          ['Ремень', character?.equipment?.belt ?? notEquipped],
          ['Медальон', character?.equipment?.necklace ?? notEquipped],
          ['Кольцо на правой руке', character?.equipment?.ring1 ?? notEquipped],
          ['Кольцо на левой руке', character?.equipment?.ring2 ?? notEquipped],
          ['Ботинки', character?.equipment?.boots ?? notEquipped],
          ['Перчатки', character?.equipment?.gloves ?? notEquipped]
      ];

      const result = fields
          .map(([label, value]) => `${label}: ${value}`)
          .join('\n');

    return `
A ${character.race} ${character.class}, ${character.appearance}, 
equipped with ${result}, 
fantasy game character portrait, detailed, high quality, 
game art style
`.trim();
  }

  async createLocationPrompt(hero: Hero, location: Location, storyResponse: StoryResponse): Promise<string> {
    const characters = location.NPCs.map(npc => ({
        age: npc.age,
        race: npc.race,
        sex: npc.sex,
        equipment: npc.equipment,
        appearance: npc.appearance
    }))
    const prompt = `
Ты - агент, генерирующий промпты для моделей по генерации изображений.
Предметная область, с которой ты работаешь - генерация изображений (first person view игрока, а также пейзажей, локаций и т.п.) для RPG DND-like игры.
Ниже перечислены имя локации, в которой игрок сейчас находится, её описание (в том числе то, что видит игрок), а также описание НПС (неигровые персонажи),
 с их расой, полом, возрастом и отличительными особенностями.
 
Используя предоставленую информацию и общие требования к стилю, тебе нужно сгенерировать промпт для генератора изображений, который максимально четко 
и содержательно бы описывал, что должно быть изображено на итоговой картинке

${location.name}: ${location.description}, 
Characters on location: ${JSON.stringify(characters)}
Внешность игрока: ${hero.appearance}

Добавляй в промпт описание внешности игрока только если по твоему, режиссерскому взгляду, он должен быть изображен на итоговой картинке. Не забывай описывать подходящие позы, профиль, если нужно

Художественное описание обстановки вокруг игрока: ${storyResponse.narrative}
fantasy 32bit pixel retro-RPG (like daggerfall, but more detailed) game environment, detailed background, 
atmospheric lighting, game art style
`.trim();

      let params: any = {
          model: this.model,
          messages: [{ role: 'system', content: prompt }],
          temperature: 1
      }

      console.log("Sending request to prompt agent", params)

      const resp = await this.openai.chat.completions.create(params)

      console.log("Received response from prompt agent", resp)

      return resp.choices[0].message.content?.toString() || ""
  }
}