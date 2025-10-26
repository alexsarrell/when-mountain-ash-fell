import mongoose, { model } from "mongoose";
import { z } from "zod";
import { extendZod, zodSchema } from "@zodyac/zod-mongoose";
import { ItemSchema as ItemZod } from "../schemas/item.schema";

extendZod(z);

type ItemDB = z.infer<typeof ItemZod>;

const ItemMongooseSchema = zodSchema(ItemZod);

export const ItemModel =
  mongoose.models.Item || model<ItemDB>("Item", ItemMongooseSchema, "items");