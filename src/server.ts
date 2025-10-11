import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import { createApp } from './app'
import { StoryAgent } from './agents/StoryAgent'
import { PromptAgent } from './agents/PromptAgent'
import { ImageService } from './services/ImageService'
import { GameService } from './services/GameService'
import { CharacterService } from './services/CharacterService'
import {MongoCharacterService} from "./services/MongoCharacterService";

dotenv.config()

async function main() {
  const app = createApp()

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rpg-game')

  const storyAgent = new StoryAgent(
    process.env.OPENAI_API_KEY || '',
    process.env.OPENAI_BASE_URL || undefined,
    process.env.OPENAI_MODEL || 'just-ai/claude/claude-sonnet-4',
    (process.env.OPENAI_JSON_MODE || 'true') === 'true'
  )
  const promptAgent = new PromptAgent(
      process.env.OPENAI_PROMPT_AGENT_MODEL || 'just-ai/claude/claude-sonnet-4',
      process.env.OPENAI_API_KEY || '',
      process.env.OPENAI_BASE_URL || undefined,
  )
  const imageService = new ImageService(
    process.env.NANO_BANANA_API_KEY || '',
    process.env.NANO_BANANA_URL || 'https://caila.io/api/mlpgateway/account/just-ai/model/gemini-nano-banana',
    process.env.STORAGE_PATH || 'public/images/generated',
    process.env.NANO_BANANA_MODEL || 'gemini-2.5-flash-image-preview'
  )
  const characterService = new CharacterService()
  const gameService = new GameService(storyAgent, promptAgent, imageService, characterService)
  const mongoCharacterService = new MongoCharacterService()

  app.locals.gameService = gameService
  app.locals.characterService = characterService
  app.locals.imageService = imageService
  app.locals.mongoCharacterService = mongoCharacterService

  const port = Number(process.env.PORT) || 3000
  app.listen(port, () => {
    console.log(`RPG Server running at http://localhost:${port}`)
  })
}

main().catch(err => {
  console.error('Fatal error', err)
  process.exit(1)
})
