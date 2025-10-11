import {CharacterSex, GameState, Hero, Item, Location} from '../types';
import {randomUUID} from "node:crypto";
import {MongoCharacterService} from "./MongoCharacterService";
import {MongoHistoryService} from "./MongoHistoryService";

const mongoCharacterService: MongoCharacterService = new MongoCharacterService()
const mongoHistoryService: MongoHistoryService = new MongoHistoryService()

export class CharacterService {

  async getCharacter(characterId: string): Promise<any | null> {
    return mongoCharacterService.getHeroById(characterId);
  }

  async getGameState(characterId: string): Promise<GameState> {
    return await mongoHistoryService.getGameState(characterId) ?? await mongoHistoryService.createGameState({
        characterId,
        currentLocation: { id: randomUUID().toString(), name: 'Village Square', description: 'A bustling square with a fountain', NPCs: [] } as Location,
        history: [],
    });
  }

  async updateCharacter(payload: Hero): Promise<void> {
      await mongoCharacterService.updateHero(payload._id, payload)
  }

  async saveCharacter(payload: Hero): Promise<void> {
      await mongoCharacterService.createHero(payload)
  }

  async saveGameState(state: GameState): Promise<void> {
      await mongoHistoryService.updateGameState(state)
  }

  mergeItems(inventory: Item[], found?: Item[]): Item[] {
    if (!found?.length) return inventory;
    const byId = new Map(inventory.map(i => [i.id, i] as const));
    for (const it of found) if (!byId.has(it.id)) byId.set(it.id, it);
    return Array.from(byId.values());
  }
}
