import type { HeroDefinition } from "@/types/data.types";
import { assertValidOrWarn, validateHeroDefinition } from "@/utils/validation";
import { brennaStonehand } from "./brennaStonehand";
import { aldricVale } from "./aldricVale";

const rawHeroes: HeroDefinition[] = [brennaStonehand, aldricVale];

export const heroesById: Record<string, HeroDefinition> = {};

for (const hero of rawHeroes) {
  const errors = validateHeroDefinition(hero);
  if (assertValidOrWarn(hero, errors, "HeroData")) {
    heroesById[hero.id] = hero;
  }
}

export function getHeroDefinition(id: string): HeroDefinition | undefined {
  return heroesById[id];
}

export const allHeroes = Object.values(heroesById);
