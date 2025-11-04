import mongoose, { model } from "mongoose";
import { z } from "zod";
import { extendZod, zodSchema } from "@zodyac/zod-mongoose";
import { HeroDBSchema } from "../schemas/hero.schema";

extendZod(z);

type HeroDB = z.infer<typeof HeroDBSchema>;

const HeroMongooseSchema = zodSchema(HeroDBSchema);

export const HeroModel =
  mongoose.models.Hero || model<HeroDB>("Hero", HeroMongooseSchema, "heroes");
