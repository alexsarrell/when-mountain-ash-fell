import { HeroModel } from "../models/Hero";
import { ItemModel } from "../models/Item";
import { Hero, HeroDB, Item } from "../types";

export class MongoCharacterService {
  async createHero(data: Hero): Promise<Hero> {
    for (const item of data.inventory) {
      await this.saveItem(item);
    }

    for (const slot of Object.keys(data.equipment)) {
      const item = data.equipment[slot as keyof typeof data.equipment];
      if (item) {
        await this.saveItem(item);
      }
    }

    const heroDB = this.heroToDb(data);
    const doc = await HeroModel.create(heroDB);
    return this.populateHero(doc.toObject());
  }

  async getHeroById(id: string): Promise<Hero | null> {
    const heroDB = await HeroModel.findById(id).lean();
    return heroDB ? this.populateHero(heroDB) : null;
  }

  async updateHero(id: string, update: Partial<Hero>): Promise<Hero | null> {
    if (update.inventory) {
      for (const item of update.inventory) {
        await this.saveItem(item);
      }
    }

    if (update.equipment) {
      for (const slot of Object.keys(update.equipment)) {
        const item = update.equipment[slot as keyof typeof update.equipment];
        if (item) {
          await this.saveItem(item);
        }
      }
    }

    const updateDB = this.heroToDb(update as Hero);
    const heroDB = await HeroModel.findByIdAndUpdate(id, updateDB, {
      new: true,
    }).lean();
    return heroDB ? this.populateHero(heroDB) : null;
  }

  async deleteHero(id: string): Promise<void> {
    await HeroModel.findByIdAndDelete(id);
  }

  private async saveItem(item: Item): Promise<void> {
    await ItemModel.findOneAndUpdate({ id: item.id }, item, {
      upsert: true,
      new: true,
    });
  }

  private heroToDb(hero: Partial<Hero>): Partial<HeroDB> {
    const { inventory, equipment, ...rest } = hero;

    const result: Partial<HeroDB> = { ...rest };

    if (inventory) {
      result.inventoryIds = inventory.map((i) => i.id);
    }

    if (equipment) {
      result.equipmentIds = {
        weapon1: equipment.weapon1?.id || null,
        weapon2: equipment.weapon2?.id || null,
        armor: equipment.armor?.id || null,
        helmet: equipment.helmet?.id || null,
        belt: equipment.belt?.id || null,
        necklace: equipment.necklace?.id || null,
        ring1: equipment.ring1?.id || null,
        ring2: equipment.ring2?.id || null,
        boots: equipment.boots?.id || null,
        gloves: equipment.gloves?.id || null,
      };
    }

    return result;
  }

  private async populateHero(heroDB: any): Promise<Hero> {
    const inventory = await ItemModel.find({
      id: { $in: heroDB.inventoryIds || [] },
    }).lean();

    const equipmentIdsArray = Object.values(heroDB.equipmentIds || {}).filter(
      Boolean,
    ) as string[];

    const equipmentItems = await ItemModel.find({
      id: { $in: equipmentIdsArray },
    }).lean();

    const equipmentMap = new Map(equipmentItems.map((item) => [item.id, item]));

    const equipment = {
      weapon1: heroDB.equipmentIds?.weapon1
        ? equipmentMap.get(heroDB.equipmentIds.weapon1) || null
        : null,
      weapon2: heroDB.equipmentIds?.weapon2
        ? equipmentMap.get(heroDB.equipmentIds.weapon2) || null
        : null,
      armor: heroDB.equipmentIds?.armor
        ? equipmentMap.get(heroDB.equipmentIds.armor) || null
        : null,
      helmet: heroDB.equipmentIds?.helmet
        ? equipmentMap.get(heroDB.equipmentIds.helmet) || null
        : null,
      belt: heroDB.equipmentIds?.belt
        ? equipmentMap.get(heroDB.equipmentIds.belt) || null
        : null,
      necklace: heroDB.equipmentIds?.necklace
        ? equipmentMap.get(heroDB.equipmentIds.necklace) || null
        : null,
      ring1: heroDB.equipmentIds?.ring1
        ? equipmentMap.get(heroDB.equipmentIds.ring1) || null
        : null,
      ring2: heroDB.equipmentIds?.ring2
        ? equipmentMap.get(heroDB.equipmentIds.ring2) || null
        : null,
      boots: heroDB.equipmentIds?.boots
        ? equipmentMap.get(heroDB.equipmentIds.boots) || null
        : null,
      gloves: heroDB.equipmentIds?.gloves
        ? equipmentMap.get(heroDB.equipmentIds.gloves) || null
        : null,
    };

    return {
      _id: heroDB._id,
      characterName: heroDB.characterName,
      age: heroDB.age,
      race: heroDB.race,
      sex: heroDB.sex,
      class: heroDB.class,
      level: heroDB.level,
      stats: heroDB.stats,
      appearance: heroDB.appearance,
      imageUrl: heroDB.imageUrl,
      publicImageUrl: heroDB.publicImageUrl,
      imageHash: heroDB.imageHash,
      inventory: inventory as any,
      equipment: equipment as any,
    };
  }
}
