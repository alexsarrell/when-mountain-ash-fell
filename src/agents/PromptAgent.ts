import {Hero, Location} from '../types';

export class PromptAgent {
  createCharacterPrompt(character: Hero): string {
    const equipment = Object.values(character.equipment)
      .filter(Boolean)
      .join(', ');

    return `
A ${character.race} ${character.class}, ${character.appearance}, 
equipped with ${equipment || 'basic clothes'}, 
fantasy game character portrait, detailed, high quality, 
game art style
`.trim();
  }

  createLocationPrompt(location: Location): string {
    return `
${location.name}: ${location.description}, 
fantasy RPG game environment, detailed background, 
atmospheric lighting, game art style
`.trim();
  }
}