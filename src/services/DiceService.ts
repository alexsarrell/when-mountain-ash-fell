import { DiceResultSchema } from "../schemas/diceResult.schema";
import { DiceResult } from "../types";
import { parse } from "dotenv";

export class DiceService {
  private baseUrl = "https://rolz.org/api/?";

  async throwDice(dice: DiceEnum, count: number = 1): Promise<DiceResult> {
    const diceString = await this.getDiceString(dice, count);
    const res = await fetch(this.baseUrl + diceString);
    const parseResult = parse(await res.text());

    return DiceResultSchema.parse({
      input: parseResult.input,
      result: parseInt(parseResult.result || "0"),
      details: parseResult.details,
    });
  }

  async getDiceString(dice: DiceEnum, count: number): Promise<string> {
    switch (dice) {
      case DiceEnum.d4:
        return `${count}d4`;
      case DiceEnum.d6:
        return `${count}d6`;
      case DiceEnum.d8:
        return `${count}d8`;
      case DiceEnum.d10:
        return `${count}d10`;
      case DiceEnum.d12:
        return `${count}d12`;
      case DiceEnum.d20:
        return `${count}d20`;
      case DiceEnum.d100:
        return `${count * 2}d10`;
    }
  }
}

export enum DiceEnum {
  d4,
  d6,
  d8,
  d10,
  d12,
  d20,
  d100,
}
