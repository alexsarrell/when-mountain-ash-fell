import crypto from "crypto";
import { HeroModel } from "../models/Hero";
import { ItemModel } from "../models/Item";
import { CharacterEquipmentIds } from "../types";

type EquipmentSlot = keyof CharacterEquipmentIds;

export class InventoryService {
  async equipItem(
    heroId: string,
    itemId: string,
    preferredSlot?: EquipmentSlot,
  ): Promise<void> {
    const heroDB = await HeroModel.findById(heroId);
    if (!heroDB) throw new Error("Hero not found");

    if (!heroDB.inventoryIds.includes(itemId)) {
      throw new Error("Item not in inventory");
    }

    const item = await ItemModel.findOne({ id: itemId });
    if (!item) throw new Error("Item not found in database");

    if (!item.equipSlots || item.equipSlots.length === 0) {
      throw new Error("Item cannot be equipped");
    }

    const slot = this.chooseSlot(
      item.equipSlots as EquipmentSlot[],
      heroDB.equipmentIds,
      preferredSlot,
    );

    if (!slot) throw new Error("No available slot for this item");

    const oldItemId = heroDB.equipmentIds[slot];
    if (oldItemId) {
      heroDB.inventoryIds.push(oldItemId);
    }

    heroDB.equipmentIds[slot] = itemId;

    heroDB.inventoryIds = heroDB.inventoryIds.filter(
      (id: string) => id !== itemId,
    );

    heroDB.imageHash = this.calculateEquipmentHash(heroDB.equipmentIds);

    await heroDB.save();
  }

  async unequipItem(heroId: string, slot: EquipmentSlot): Promise<void> {
    const heroDB = await HeroModel.findById(heroId);
    if (!heroDB) throw new Error("Hero not found");

    const itemId = heroDB.equipmentIds[slot];
    if (!itemId) throw new Error("Slot is empty");

    heroDB.inventoryIds.push(itemId);
    heroDB.equipmentIds[slot] = null;

    heroDB.imageHash = this.calculateEquipmentHash(heroDB.equipmentIds);

    await heroDB.save();
  }

  private chooseSlot(
    availableSlots: EquipmentSlot[],
    currentEquipmentIds: CharacterEquipmentIds,
    preferredSlot?: EquipmentSlot,
  ): EquipmentSlot | null {
    if (preferredSlot && availableSlots.includes(preferredSlot)) {
      return preferredSlot;
    }

    const emptySlot = availableSlots.find((slot) => !currentEquipmentIds[slot]);
    if (emptySlot) return emptySlot;

    return availableSlots[0];
  }

  private calculateEquipmentHash(equipmentIds: CharacterEquipmentIds): string {
    return crypto
      .createHash("md5")
      .update(JSON.stringify(equipmentIds))
      .digest("hex");
  }
}
