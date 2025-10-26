import { Router } from "express";
import { PROMPT_CONFIGURATION } from "../config/PromptProperties";

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
    } = req.body || {};

    const prompt = PROMPT_CONFIGURATION.prompt.character
      .replace("{{ character_name }}", name)
      .replace("{{ character_race }}", race)
      .replace("{{ character_class }}", cls)
      .replace("{{ character_sex }}", sex)
      .replace("{{ character_age }}", age)
      .replace("{{ character_appearance }}", appearance)
      .replace("{{ character_stats }}", JSON.stringify(stats))
      .replace("{{ character_equipment }}", JSON.stringify(cls?.startingItems));

    const url = await imageService.generateCharacterImage(prompt);
    res.json({ imageUrl: url, prompt });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "Character image generation error",
      message: err.message,
    });
  }
});

export default router;
