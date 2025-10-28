import { Router } from "express";
import { GameService } from "../services/GameService";
import {
  RACES,
  CLASSES,
  STARTING_ITEMS,
  STAT_DEFINITIONS,
} from "../data/game.content";
import {CharacterService} from "../services/CharacterService";

const router = Router();

router.get("/character/:characterId", async (req, res) => {
  const characterService = req.app.locals.characterService as CharacterService
  const characterId = req.params.characterId
  console.log('Received getCharacter request for character', characterId)
  const character = await characterService.getCharacter(characterId);
  console.log('Character is found', character)
  res.json(character)
  /**
   * TODO Достаем из req.body characterId и делаем запрос в MongoDB getCharacter. Дальше из результата достаём инвентарь и equipment и возвращаем на фронтенд
   * const characterService = req.app.locals.characterService as CharacterService
   * const hero = await characterService.getCharacter(characterId)
   */
})

router.get("/content", (req, res) => {
  res.json({
    races: RACES,
    classes: CLASSES,
    items: STARTING_ITEMS,
    stats: STAT_DEFINITIONS,
  });
});

router.post("/action", async (req, res) => {
  console.log("HTTP POST /game/action", { body: req.body });
  try {
    const { characterId, action } = req.body as {
      characterId: string;
      action: string;
    };
    const gameService = req.app.locals.gameService as GameService;
    console.log("game: process start", { characterId, action });
    const result = await gameService.processPlayerAction(characterId, action);
    console.log("game: process done", { keys: Object.keys(result || {}) });
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Game error", message: err.message });
  }
});

export default router;
