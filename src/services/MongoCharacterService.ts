import { HeroModel } from '../models/Hero'
import { HeroSchema } from '../schemas/hero.schema'
import {Hero} from "../types";

function toHero(obj: any) {
  return HeroSchema.parse(obj)
}

export class MongoCharacterService {
  async createHero(data: Hero): Promise<any> {
    const doc = await HeroModel.create({ ...(data) })
    return toHero(doc.toObject())
  }

  async getHeroById(id: string): Promise<any | null> {
    const obj = await HeroModel.findById(id).lean()
    return obj ? toHero(obj) : null
  }

  async updateHero(id: string, update: Partial<any>): Promise<any | null> {
    const obj = await HeroModel.findByIdAndUpdate(id, update as any, { new: true }).lean()
    return obj ? toHero(obj) : null
  }

  async deleteHero(id: string): Promise<void> {
    await HeroModel.findByIdAndDelete(id)
  }
}
