import {CharacterSex, GameState, Item, Location} from '../types';
import {randomUUID} from "node:crypto";
import {MongoCharacterService} from "./MongoCharacterService";

const mongoCharacterService: MongoCharacterService = new MongoCharacterService()

export class CharacterService {

  async getCharacter(characterId: string): Promise<any | null> {
    return mongoCharacterService.getHeroById(characterId);
  }

  async getGameState(characterId: string): Promise<GameState> {
    return {
      characterId,
      currentLocation: { id: randomUUID().toString(), name: 'Village Square', description: 'A bustling square with a fountain', NPCs: [] } as Location,
      history: [],
    };
  }

  async saveCharacter(payload: any): Promise<void> {
      await mongoCharacterService.createHero(payload)
  }

  async saveGameState(state: GameState): Promise<void> {}

  mergeItems(inventory: Item[], found?: Item[]): Item[] {
    if (!found?.length) return inventory;
    const byId = new Map(inventory.map(i => [i.id, i] as const));
    for (const it of found) if (!byId.has(it.id)) byId.set(it.id, it);
    return Array.from(byId.values());
  }
}
