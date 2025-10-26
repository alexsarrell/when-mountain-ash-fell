import { GameState, GameStateSchema } from "../types";
import { GameStateModel } from "../models/GameState";

function toGameState(obj: any) {
  if (obj?.currentLocation?.NPCs) {
    obj.currentLocation.NPCs = obj.currentLocation.NPCs.map((n: any) => ({
      ...n,
      inventory: Array.isArray(n.inventory)
        ? n.inventory.map((it: any) => ({ ...it, stats: it?.stats ?? {} }))
        : [],
    }));
  }
  return GameStateSchema.parse(obj);
}

export class MongoHistoryService {
  async createGameState(data: any): Promise<any> {
    const doc = await GameStateModel.create({ ...data });
    return toGameState(doc.toObject());
  }
  async getGameState(characterId: string): Promise<GameState | null> {
    const res = await GameStateModel.findOne({ characterId }).lean();
    return res ? toGameState(res) : null;
  }
  async updateGameState(gameState: GameState): Promise<void> {
    await GameStateModel.findOneAndUpdate(
      { characterId: gameState.characterId },
      gameState,
      { upsert: true, new: true },
    ).lean();
  }
}
