import type { HeroDefinition } from "@/types/data.types";
import { assertValidOrWarn, validateHeroDefinition } from "@/utils/validation";
import { brennaStonehand } from "./brennaStonehand";
import { aldricVale } from "./aldricVale";
import { elaraMistbow } from "./elaraMistbow";

const rawHeroes: HeroDefinition[] = [brennaStonehand, elaraMistbow, aldricVale];

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

/** Pick the default sparring opponent for a given hero. */
export function getDefaultOpponentHeroId(playerHeroId: string): string {
  const player = getHeroDefinition(playerHeroId);
  if (!player) return "aldric_vale";
  const opponent = allHeroes.find(
    (h) => h.id !== playerHeroId && h.faction !== player.faction,
  );
  return opponent?.id ?? "aldric_vale";
}
