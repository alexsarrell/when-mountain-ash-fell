import { StoryAgent } from "../agents/StoryAgent";
import { PromptAgent } from "../agents/PromptAgent";
import { ImageService } from "./ImageService";
import { CharacterService } from "./CharacterService";
import { StoryResponse, Location, NPCDto, Item, Hero } from "../types";
import { randomUUID } from "node:crypto";

export class GameService {
  constructor(
    private storyAgent: StoryAgent,
    private promptAgent: PromptAgent,
    private imageService: ImageService,
    private characterService: CharacterService,
  ) {}

  async processPlayerAction(characterId: string, action: string) {
    console.log("svc: processPlayerAction", {
      characterId,
      actionLen: action?.length,
    });
    const character = await this.characterService.getCharacter(characterId);
    if (!character) {
      const err: any = new Error("Hero not found");
      err.status = 404;
      throw err;
    }
    console.log("svc: character loaded", { id: characterId });
    const gameState = await this.characterService.getGameState(characterId);
    console.log("svc: gameState loaded", {
      location: gameState.currentLocation,
    });

    const storyResponse: StoryResponse = await this.storyAgent.processAction(
      action,
      character,
      gameState,
    );
    console.log("svc: storyResponse", {
      items: storyResponse.itemState?.itemsFound?.length || 0,
      equipment: storyResponse.currentEquipment,
    });

    if (storyResponse.itemState?.itemsFound?.length) {
      character.inventory = this.characterService.mergeItems(
        character.inventory,
        storyResponse.itemState.itemsFound,
      );
    }

    if (storyResponse.itemState?.itemsLost?.length) {
      const lostIds = new Set(
        (storyResponse.itemState.itemsLost as Item[]).map((i: Item) => i.id),
      );
      character.inventory = character.inventory.filter(
        (i: Item) => !lostIds.has(i.id),
      );
    }

    const npcs: NPCDto[] = storyResponse.NPCs || [];
    gameState.currentLocation = {
      id: randomUUID().toString(),
      name: storyResponse.location,
      description: storyResponse.locationDescription,
      NPCs: npcs,
    } as Location;
    console.log("New location achieved", storyResponse.location);
    const locationPrompt = await this.promptAgent.createLocationPrompt(
      character,
      gameState.currentLocation,
      storyResponse,
    );
    try {
      console.log("svc: generating location image");
      gameState.currentLocation.locationImageUrl =
        await this.imageService.generateLocationImage(locationPrompt);
      console.log(
        "svc: location image url",
        gameState.currentLocation.locationImageUrl,
      );
    } catch (e) {
      console.error("Location image generation failed", e);
    }

    if (storyResponse.currentEquipment) {
      const newHash = this.imageService.calculateEquipmentHash(
        storyResponse.currentEquipment ?? {},
      );
      console.log("svc: equipment hash", {
        newHash,
        prevHash: character.imageHash,
      });

      if (newHash !== character.imageHash && character.imageHash) {
        character.equipment = storyResponse.currentEquipment;
        const charPrompt = this.promptAgent.toCharacterImagePrompt(
          this.promptAgent.createCharacterPrompt(character),
        );
        try {
          const prevImageUrl = await this.buildImageUrl(character);
          console.log("Previous image url", prevImageUrl);
          console.log("Generate image prompt", charPrompt);
          character.imageUrl = await this.imageService.generateCharacterImage(
            charPrompt,
            character,
          );
          console.log("svc: character image url", character.imageUrl);
        } catch (e) {
          console.error("Character image generation failed", e);
        }
        character.imageHash = newHash;
      }
    }

    gameState.history.push({
      action,
      response: JSON.stringify(storyResponse),
      timestamp: new Date(),
    });

    await this.characterService.updateCharacter(character);
    await this.characterService.saveGameState(gameState);

    return {
      narrative: storyResponse.narrative,
      characterImage: character.imageUrl,
      locationImage: gameState.currentLocation.locationImageUrl,
      location: gameState.currentLocation,
    };
  }

  private async buildImageUrl(character: Hero): Promise<string> {
    return `public${
      character.imageUrl
        ? decodeURIComponent(character.imageUrl)
        : (() => {
            throw new Error(
              `Image URL is required for character ${character}.`,
            );
          })()
    }`;
  }
}
