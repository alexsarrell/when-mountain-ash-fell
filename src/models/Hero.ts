import mongoose, { model } from "mongoose";
import { z } from "zod";
import { extendZod, zodSchema } from "@zodyac/zod-mongoose";
import { HeroSchema as HeroZod } from "../schemas/hero.schema";

extendZod(z);

type HeroDB = z.infer<typeof HeroZod>;

const HeroMongooseSchema = zodSchema(HeroZod);

export const HeroModel =
  mongoose.models.Hero || model<HeroDB>("Hero", HeroMongooseSchema, "heroes");
