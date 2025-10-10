# When Mountain Ash Fell — AI RPG (MVP)

Простой текстовый RPG-проект на Node.js + TypeScript с ИИ-генерацией сюжета и изображений. KISS: один монолит, минимум зависимостей.

## Возможности
- Игрок отправляет действие — ИИ генерирует ответ (сюжет, локации, найденные/потерянные предметы)
- При смене экипировки регенерируется портрет персонажа
- При смене локации генерируется изображение локации
- Данные в MongoDB (Mongoose). Mongoose-схемы генерируются из Zod (zod-to-mongoose)
- Простой фронтенд (HTML + JS)

## Технологии
- Node.js 20+, TypeScript 5
- Express 4, CORS
- MongoDB + Mongoose 8
- Zod 4, zod-to-mongoose 1.3.x
- OpenAI SDK (LLM), совместимый image API (Nano Banana/MLP)

## Структура
```
src/
  agents/
    StoryAgent.ts         # Генерация сюжета (LLM)
    PromptAgent.ts        # Промпты для картинок
  services/
    GameService.ts        # Игровой цикл/оркестратор
    CharacterService.ts   # Работа с героем/состоянием
    MongoCharacterService.ts # Доступ к БД
    ImageService.ts       # Генерация и сохранение изображений
  models/
    Hero.ts               # Mongoose-модель для работы с MongoDB (из Zod)
  schemas/
    hero.schema.ts        # Zod героя и зависимостей
    npc.schema.ts         # Zod NPC (DTO для StoryResponse)
    item.schema.ts        # Zod предмета/состояния предметов
    character.schema.ts   # Zod характеристик/экипировки
    location.schema.ts    # Zod локации
    storyResponse.schema.ts # Zod ответа ИИ
    gameState.schema.ts   # Zod состояния игры
  routes/
    game.routes.ts        # POST /game/action, GET /game/content
    character.routes.ts   # POST /character, POST /character/generate-image
  data/
    game.content.ts       # Расы, классы, предметы, определения статов
public/
  html/create-character.html
  script/create-character.js
  css/*.css
server.ts
```

## Архитектура
- Zod-first: все контракты в src/schemas/*.ts, типы через z.infer
- Mongoose-схемы генерируются из Zod (zod-to-mongoose)
- DTO-подход для StoryResponse: NPC как DTO (race/class — строковые ID)
- Оркестратор GameService координирует StoryAgent, PromptAgent, ImageService, CharacterService

### Игровой цикл (GameService)
1) Загружаем героя + GameState (CharacterService)
2) StoryAgent.processAction -> StoryResponse (валидируется Zod)
3) Обновляем инвентарь (itemsFound/itemsLost)
4) Новая локация -> обновляем gameState.currentLocation, генерируем картинку (PromptAgent + ImageService)
5) Смена экипировки -> новый хеш, генерация портрета
6) Пишем запись в history и сохраняем в БД

### StoryAgent
- Формирует промпт (лор + герой + локация) и вызывает LLM
- Разбирает ответ, валидирует StoryResponseSchema

### ImageService
- POST {model, messages:[{text: prompt}]} к совместимому API /predict
- Извлекает URL или data:URI, сохраняет PNG в public/images/generated

## Маршруты
- GET /game/content — справочники (расы, классы, предметы, статы)
- POST /game/action — обработка действия игрока
- POST /character — сохранение героя
- POST /character/generate-image — генерация портрета с фронтенда

## Модели
- models/Hero.ts — генерируется из schemas/hero.schema.ts
- models/NPC.ts — генерируется из schemas/npc.schema.ts

## Основные схемы
- hero.schema.ts: HeroSchema (characterName, age, race, sex, class, level?, stats, inventory, equipment?, appearance, imageUrl?, imageHash?)
- npc.schema.ts: NPCSchema (race/class — ID, sex — MALE/FEMALE)
- item.schema.ts: ItemSchema, ItemStateSchema
- character.schema.ts: CharacterStatsSchema из STAT_DEFINITIONS; CharacterEquipmentSchema
- storyResponse.schema.ts: narrative, location, description, NPCs, itemState, equipmentChanged и т.д.
- location.schema.ts: id, name, description, NPCs, locationImageUrl?
- gameState.schema.ts: GameHistoryEntry, GameState

## Паттерны
- Single source of truth: Zod -> типы и модели
- DTO для ИИ-ответов, разделение внешнего/внутреннего
- Service layer (Game/Character/Image) + Repository-like (MongoCharacterService)
- Хеш экипировки для контроля перегенерации изображений

## Запуск
```
npm install
cp .env.example .env
npm run dev
# или
npm run build && npm start
```

### .env
```
MONGODB_URI=mongodb://localhost:27017/rpg-game
OPENAI_API_KEY=sk-...
NANO_BANANA_API_KEY=...
NANO_BANANA_URL=https://api.nanobanana.com
STORAGE_PATH=public/images/generated
PORT=3000
```

## Фронтенд (create-character)
- Поля: имя, пол, возраст, внешность, выбор расы/класса, распределение статов
- «Сгенерировать спрайт» активно после валидации; «Создать персонажа» — после успешной генерации портрета
- Вызывает /character/generate-image и /character
