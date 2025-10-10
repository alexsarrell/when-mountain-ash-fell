import { Router } from 'express'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { characterService } = req.app.locals
    const id = String(req.query.id || 'default')
    const character = await characterService.getCharacter(id)
    res.json(character)
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: 'Character error', message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { characterService } = req.app.locals
    await characterService.saveCharacter(req.body)
    res.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: 'Character error', message: err.message })
  }
})

router.post('/generate-image', async (req, res) => {
  try {
    const { imageService } = req.app.locals
    const { name, sex, race, class: cls, stats, appearance, items } = req.body || {}
    const inv = Array.isArray(items) ? items.map((it: any) => it?.name || it?.id || it).join(', ') : ''
    const equipment = Array.isArray(cls?.startingItems) ? cls.startingItems.join(', ') : ''
    const prompt = [
      'Full-body В ПОЛНЫЙ РОСТ pixel art RPG character portrait',
      'Medieval city background, retro 16-bit style',
      'High-contrast, crisp pixels, limited palette',
      `Name: ${name || 'Unknown'}`,
      `Sex: ${sex}`,
      `Race: ${typeof race === 'string' ? race : race?.name || ''}`,
      `Class: ${cls?.name || cls}`,
      `Appearance: ${appearance}. `,
      stats ? `Stats: STR ${stats.strength} INT ${stats.intelligence} AGI ${stats.agility} CHA ${stats.charisma} ATR ${stats.attractiveness} STL ${stats.stealth}.  Обращай внимание на статы. Чем ближе сила к 10 - тем накачаннее персонаж, чем выше привлекательность тем красивее и наоборот. Чем ближе внешний параметр к нулю, тем он хуже.` : '',
      equipment ? `Equipment: ${equipment}` : '',
      inv ? `Inventory: ${inv}` : ''
    ].filter(Boolean).join('\n')

    const url = await imageService.generateCharacterImage(prompt)
    res.json({ imageUrl: url, prompt })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: 'Character image generation error', message: err.message })
  }
})

export default router