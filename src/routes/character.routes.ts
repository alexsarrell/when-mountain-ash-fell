import { Router } from "express";
import { PROMPT_CONFIGURATION } from "../config/PromptProperties";
import { InventoryService } from "../services/InventoryService";
import { CharacterValidationService } from "../services/CharacterValidationService";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { characterService } = req.app.locals;
    const id = String(req.query.id || "default");
    const character = await characterService.getCharacter(id);
    res.json(character);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Character error", message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { characterService } = req.app.locals;
    req.body.imageUrl = req.body.imageUrl.replaceAll("%2F", "/");
    console.log("Create character request", req.body);
    await characterService.saveCharacter(req.body);
    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Character error", message: err.message });
  }
});

router.post("/generate-image", async (req, res) => {
  try {
    const { imageService } = req.app.locals;
    const {
      name,
      sex,
      race,
      class: cls,
      stats,
      appearance,
      age,
      equipment,
    } = req.body || {};

    const equipmentDescription = equipment
      ? Object.entries(equipment)
          .filter(([_, item]) => item)
          .map(([slot, item]: [string, any]) => `${slot}: ${item.name}`)
          .join(", ")
      : cls?.startingItems || "";

    const prompt = PROMPT_CONFIGURATION.prompt.character
      .replace("{{ character_name }}", name)
      .replace("{{ character_race }}", race)
      .replace("{{ character_class }}", cls)
      .replace("{{ character_sex }}", sex)
      .replace("{{ character_age }}", age)
      .replace("{{ character_appearance }}", appearance)
      .replace("{{ character_stats }}", JSON.stringify(stats))
      .replace("{{ character_equipment }}", equipmentDescription);

    const url = await imageService.generateCharacterImage(prompt);
    const cleanUrl = url.replaceAll("%2F", "/");
    res.json({ imageUrl: cleanUrl, prompt });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "Character image generation error",
      message: err.message,
    });
  }
});

router.post("/sprite/regenerate", async (req, res) => {
  try {
    const { characterId, equippedItemIds, unequippedItemIds } = req.body as {
      characterId: string;
      equippedItemIds: string[];
      unequippedItemIds: string[];
    };
    const { characterService, gameService } = req.app.locals;
    const character = await characterService.getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }
    const imageUrl = await gameService.regenerateCharacterImage(
      character,
      equippedItemIds,
      unequippedItemIds,
    );
    res.json({ imageUrl });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Image generation error", message: err.message });
  }
});

router.post("/:id/equip", async (req, res) => {
  try {
    const inventoryService = new InventoryService();
    await inventoryService.equipItem(
      req.params.id,
      req.body.itemId,
      req.body.slot,
    );

    const { characterService } = req.app.locals;
    const hero = await characterService.getCharacter(req.params.id);
    res.json({ success: true, hero });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/unequip", async (req, res) => {
  try {
    const inventoryService = new InventoryService();
    await inventoryService.unequipItem(req.params.id, req.body.slot);

    const { characterService } = req.app.locals;
    const hero = await characterService.getCharacter(req.params.id);
    res.json({ success: true, hero });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post("/validate", async (req, res) => {
  try {
    const { appearance, inventory } = req.body;
    const { chatCompletionService } = req.app.locals;

    const validationService = new CharacterValidationService(
      chatCompletionService,
    );
    const result = await validationService.validateAndParseCharacter(
      appearance || "",
      inventory || "",
    );

    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "Character validation error",
      message: err.message,
    });
  }
});

export default router;
