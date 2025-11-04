import { ItemModel } from "../models/Item";
import { ItemSchema } from "../schemas/item.schema";
import { Item } from "../types";

function toItem(obj: unknown) {
  return ItemSchema.parse(obj);
}

export class MongoItemService {
  async createItem(data: Item): Promise<Item> {
    const doc = await ItemModel.create({ ...data });
    return toItem(doc.toObject());
  }

  async getItemById(id: string): Promise<Item | null> {
    const obj = await ItemModel.findOne({ id }).lean();
    return obj ? toItem(obj) : null;
  }

  async updateItem(id: string, update: Partial<Item>): Promise<Item | null> {
    const obj = await ItemModel.findByIdAndUpdate(id, update, { new: true }).lean();
    return obj ? toItem(obj) : null;
  }

  async deleteItem(id: string): Promise<void> {
    await ItemModel.findByIdAndDelete(id);
  }

  async listItems(filter: Partial<Item> = {}): Promise<Item[]> {
    const rows = await ItemModel.find(filter as any).lean();
    return rows.map(toItem);
  }
}
