import * as yaml from "js-yaml";
import * as fs from "fs";
import * as path from "path";

export interface PromptProperties {
  prompt: {
    narrator: string;
    imageGenerator?: string;
    prompter: string;
    character: string;
    characterImage: string;
    characterValidator: string;
  };
}

const configPath = path.resolve("src/resources/prompt.yml");
const file = fs.readFileSync(configPath, "utf8");
const parsed = yaml.load(file) as any;

if (parsed && parsed.prompt) {
  if (parsed.prompt["image-generator"] && !parsed.prompt.imageGenerator) {
    parsed.prompt.imageGenerator = parsed.prompt["image-generator"];
  }
}

export const PROMPT_CONFIGURATION = parsed as PromptProperties;
