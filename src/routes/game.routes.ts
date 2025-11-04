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
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  try {
    const { characterId, action } = req.body as {
      characterId: string;
      action: string;
    };
    const gameService = req.app.locals.gameService as GameService;
    console.log("game: process start", { characterId, action });
    
    await gameService.processPlayerActionSSE(characterId, action, (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
    
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

export default router;
