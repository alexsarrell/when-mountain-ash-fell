import { StoryAgent } from "../agents/StoryAgent";
import { PromptAgent } from "../agents/PromptAgent";
import { ImageService } from "./ImageService";
import { CharacterService } from "./CharacterService";
import { MongoItemService } from "./MongoItemService";
import {
  CharacterEquipment,
  Hero,
  Item,
  Location,
  NPCDto,
  StoryResponse,
} from "../types";
import { randomUUID } from "node:crypto";

export type SSEEvent =
  | { type: "dice_roll"; dice: string; count: number; result: number }
  | {
      type: "narrative";
      narrative: string;
      location: string;
      locationDescription: string;
    }
  | { type: "location_image"; url: string }
  | { type: "character_image"; url: string }
  | { type: "error"; message: string }
  | { type: "done" };

export class GameService {
  constructor(
    private storyAgent: StoryAgent,
    private promptAgent: PromptAgent,
    private imageService: ImageService,
    private characterService: CharacterService,
  ) {}

  async processPlayerActionSSE(
    characterId: string,
    action: string,
    emit: (event: SSEEvent) => void,
  ): Promise<void> {
    console.log("svc: processPlayerActionSSE", {
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
      (dice, count, result) => {
        emit({ type: "dice_roll", dice, count, result });
      },
    );
    console.log("svc: storyResponse", {
      items: storyResponse.itemState?.itemsFound?.length || 0,
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

      for (const slot in character.equipment) {
        const equippedItem =
          character.equipment[slot as keyof CharacterEquipment];
        if (equippedItem && lostIds.has(equippedItem.id)) {
          character.equipment[slot as keyof CharacterEquipment] = undefined;
        }
      }
    }

    const npcs: NPCDto[] = storyResponse.NPCs || [];
    gameState.currentLocation = {
      id: randomUUID().toString(),
      name: storyResponse.location,
      description: storyResponse.locationDescription,
      NPCs: npcs,
    } as Location;
    console.log("New location achieved", storyResponse.location);

    emit({
      type: "narrative",
      narrative: storyResponse.narrative,
      location: storyResponse.location,
      locationDescription: storyResponse.locationDescription,
    });

    gameState.history.push({
      action,
      response: JSON.stringify(storyResponse),
      timestamp: new Date(),
    });

    await this.characterService.updateCharacter(character);
    await this.characterService.saveGameState(gameState);

    await Promise.all([
      (async () => {
        try {
          const locationPrompt = await this.promptAgent.createLocationPrompt(
            character,
            gameState.currentLocation,
            action,
            storyResponse,
          );
          const prevImageUrl = `public${await this.buildImageUrl(character)}`;
          console.log(
            `svc: generating location image with character ${prevImageUrl}`,
          );
          gameState.currentLocation.locationImageUrl =
            await this.imageService.generateLocationImage(
              locationPrompt,
              character,
              prevImageUrl,
            );
          console.log(
            "svc: location image url",
            gameState.currentLocation.locationImageUrl,
          );
          await this.characterService.saveGameState(gameState);
          console.log(
            "svc: emitting location_image event",
            gameState.currentLocation.locationImageUrl,
          );
          const imageUrl = gameState.currentLocation.locationImageUrl;
          if (!imageUrl) {
            throw new Error("Location image URL should be not null");
          }
          emit({
            type: "location_image",
            url: imageUrl,
          });
        } catch (e) {
          console.error("Location image generation failed", e);
        }
      })(),
    ]).catch((err) => console.error("Image generation error:", err));
  }

  async regenerateCharacterImage(
    character: Hero,
    equippedItemIds: string[] = [],
    unequippedItemIds: string[] = [],
  ): Promise<string> {
    console.log("Regenerate character image", {
      equippedItemIds,
      unequippedItemIds,
      inventoryIds: character.inventory.map((i) => i.id),
      equipmentIds: Object.values(character.equipment)
        .filter((item) => item != null)
        .map((i) => i!.id),
    });

    const itemService = new MongoItemService();

    const equippedItemsLite = Object.values(character.equipment)
      .filter((item) => item != null && equippedItemIds.includes(item.id))
      .map((item) => item!);

    const equippedItemsFull = await Promise.all(
      equippedItemsLite.map(async (lite) => {
        const full = await itemService.getItemById(lite.id);
        if (!full) {
          throw new Error(`Item not found by ID ${lite.id}`);
        }
        return full;
      }),
    );

    const unequippedItems = character.inventory.filter((item) =>
      unequippedItemIds.includes(item.id),
    );

    console.log("Found items", {
      equippedItems: equippedItemsFull.map((i) => i.name),
      unequippedItems: unequippedItems.map((i) => i.name),
    });

    const charPrompt = this.promptAgent.characterImageRegenerationPromptByItems(
      character,
      equippedItemsFull,
      unequippedItems.map((i) => i.name),
    );
    const prevImageUrl = `public${await this.buildImageUrl(character)}`;
    console.log("Previous image url", prevImageUrl);
    console.log("Generate image prompt", charPrompt);
    character.imageUrl = await this.imageService.generateCharacterImage(
      charPrompt,
      character,
      prevImageUrl,
    );
    console.log("svc: character image url", character.imageUrl);
    character.imageHash = this.imageService.calculateEquipmentHash(
      character.equipment,
    );
    await this.characterService.updateCharacter(character);
    return character.imageUrl!;
  }

  private async buildImageUrl(character: Hero): Promise<string> {
    return character.imageUrl
      ? decodeURIComponent(character.imageUrl)
      : (() => {
          throw new Error(`Image URL is required for character ${character}.`);
        })();
  }
}

/**
 *     if (storyResponse.currentEquipment) {
 *       const newHash = this.imageService.calculateEquipmentHash(
 *         storyResponse.currentEquipment ?? {},
 *       );
 *       console.log("svc: equipment hash", {
 *         newHash,
 *         prevHash: character.imageHash,
 *       });
 *       if (newHash !== character.imageHash) {
 *         character.equipment = storyResponse.currentEquipment;
 *         try {
 *           await this.regenerateCharacterImage(character);
 *         } catch (e) {
 *           console.error("Character image generation failed", e);
 *         }
 *       }
 *     }
 */
