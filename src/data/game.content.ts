// src/data/game-content.ts

// ============================================
// РАСЫ (только 3 базовые)
// ============================================

export interface Race {
  id: string;
  name: string;
  description: string;
  statBonuses: {
    strength: number;
    intelligence: number;
    agility: number;
  };
}

export const RACES: Race[] = [
  {
    id: "human",
    name: "Человек",
    description: "Универсальная раса без явных бонусов",
    statBonuses: { strength: 0, intelligence: 0, agility: 0 },
  },
  {
    id: "elf",
    name: "Эльф",
    description: "Изящные маги",
    statBonuses: { strength: -1, intelligence: 3, agility: 2 },
  },
  {
    id: "orc",
    name: "Орк",
    description: "Могучие воины",
    statBonuses: { strength: 3, intelligence: -2, agility: 0 },
  },
  {
    id: "tiefling",
    name: "Тифлинг",
    description: "Потомки демонов с харизмой и огненной магией",
    statBonuses: { strength: 0, intelligence: 2, agility: 1 },
  },
  {
    id: "gnome",
    name: "Гном",
    description: "Маленькие изобретатели и иллюзионисты",
    statBonuses: { strength: -2, intelligence: 3, agility: 1 },
  },
  {
    id: "succubus",
    name: "Суккуб",
    description: "Соблазнительные демоны с магией очарования",
    statBonuses: { strength: -1, intelligence: 2, agility: 2 },
  },
  {
    id: "dwarf",
    name: "Дворф",
    description: "Крепкие горные жители, мастера кузнечного дела",
    statBonuses: { strength: 2, intelligence: 0, agility: -1 },
  },
  {
    id: "hobbit",
    name: "Хоббит",
    description: "Низкорослые и ловкие любители комфорта",
    statBonuses: { strength: -2, intelligence: 1, agility: 3 },
  },
];

// ============================================
// КЛАССЫ
// ============================================

export interface GameClass {
  id: string;
  name: string;
  description: string;
  baseStats: {
    health: number;
    strength: number;
    intelligence: number;
    agility: number;
  };
  startingItems: string[]; // ID предметов
}

export const CLASSES: GameClass[] = [
  {
    id: "warrior",
    name: "Воин",
    description: "Мастер ближнего боя",
    baseStats: {
      health: 120,
      strength: 3,
      intelligence: 1,
      agility: 1,
    },
    startingItems: ["iron_sword", "leather_armor"],
  },
  {
    id: "mage",
    name: "Маг",
    description: "Повелитель магии",
    baseStats: {
      health: 70,
      strength: 0,
      intelligence: 4,
      agility: 1,
    },
    startingItems: ["wooden_staff", "mage_robe"],
  },
  {
    id: "rogue",
    name: "Разбойник",
    description: "Мастер скрытности",
    baseStats: {
      health: 90,
      strength: 1,
      intelligence: 2,
      agility: 2,
    },
    startingItems: ["steel_dagger", "leather_vest"],
  },
  {
    id: "peasant",
    name: "Крестьянин",
    description: "",
    baseStats: {
      health: 90,
      strength: 1,
      intelligence: 0,
      agility: 1,
    },
    startingItems: ["scythe", "homespun_clothing"],
  }
];

// ============================================
// СТАРТОВЫЕ ПРЕДМЕТЫ
// ============================================

export const STARTING_ITEMS: Record<
  string,
  {
    name: string;
    type: string;
    description: string;
    stats?: any;
  }
> = {
  // Воин
  iron_sword: {
    name: "Железный меч",
    type: "weapon",
    description: "Простой меч",
    stats: { damage: 15 },
  },
  leather_armor: {
    name: "Кожаная броня",
    type: "armor",
    description: "Легкая броня",
    stats: { defense: 8 },
  },

  water_pistol: {
    name: "Водяной пистолет",
    type: "weapon",
    description: "Большой яркий водяной пистолет",
    stats: { damage: 20 },
  },

  // Маг
  wooden_staff: {
    name: "Деревянный посох",
    type: "weapon",
    description: "Посох мага",
    stats: { damage: 8 },
  },
  mage_robe: {
    name: "Роба мага",
    type: "armor",
    description: "Легкая роба",
    stats: { defense: 3, intelligence: 1 },
  },

  // Разбойник
  steel_dagger: {
    name: "Стальной кинжал",
    type: "weapon",
    description: "Острый кинжал",
    stats: { damage: 12, agility: 1 },
  },
  leather_vest: {
    name: "Кожаный жилет",
    type: "armor",
    description: "Легкий жилет",
    stats: { defense: 5 },
  },

  scythe: {
    name: "Коса",
    type: "weapon",
    description: "Хозяйственный инструмент, но сгодится и как оружие",
    stats: { damage: 5 },
  },

  homespun_clothing: {
    name: "Домотканная одежда",
    type: "armor",
    description: "Свободные льняные домотканные штаны и рубаха",
    stats: { defence: 5 },
  },
};

export const STAT_DEFINITIONS = {
  health: {
    label: "Здоровье",
    description: "Количество урона, которое может выдержать персонаж",
    category: "vital",
    defaultValue: 100,
    min: 1,
    max: 999,
  },
  mana: {
    label: "Мана",
    description: "Энергия для использования заклинаний",
    category: "vital",
    defaultValue: 50,
    min: 0,
    max: 999,
  },
  strength: {
    label: "Сила",
    description: "Физическая мощь, влияет на урон ближнего боя",
    category: "primary",
    defaultValue: 0,
    min: -10,
    max: 10,
  },
  intelligence: {
    label: "Интеллект",
    description: "Умственные способности, влияет на силу магии",
    category: "primary",
    defaultValue: 0,
    min: -10,
    max: 10,
  },
  agility: {
    label: "Ловкость",
    description: "Скорость и точность атак",
    category: "primary",
    defaultValue: 0,
    min: -10,
    max: 10,
  },
  wisdom: {
    label: "Мудрость",
    description: "Духовная сила и восстановление маны",
    category: "primary",
    defaultValue: 0,
    min: -10,
    max: 10,
  },
  attractiveness: {
    label: "Привлекательность",
    description: "Внешняя красота, влияет на отношение к герою при знакомстве",
    category: "primary",
    defaultValue: 0,
    min: -10,
    max: 10,
  },
  charisma: {
    label: "Харизма",
    description: "Способность влиять на других",
    category: "primary",
    defaultValue: 0,
    min: -10,
    max: 10,
  },
  stealth: {
    label: "Скрытность",
    description: "Способность оставаться незамеченным",
    category: "primary",
    defaultValue: 0,
    min: -10,
    max: 10,
  },
  perception: {
    label: "Концентрация",
    description: "Способность замечать детали и скрытые объекты",
    category: "primary",
    defaultValue: 0,
    min: -10,
    max: 10,
  },
} as const;

export type StatKey = keyof typeof STAT_DEFINITIONS;
export type StatDefinition = (typeof STAT_DEFINITIONS)[StatKey];
export type StatCategory = StatDefinition["category"];

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

export function getRaceById(id: string) {
  return RACES.find((r) => r.id === id);
}

export function getClassById(id: string) {
  return CLASSES.find((c) => c.id === id);
}

export function getStartingItems(classId: string) {
  const gameClass = getClassById(classId);
  if (!gameClass) return [];

  return gameClass.startingItems.map((id) => ({
    ...STARTING_ITEMS[id],
    id,
  }));
}
