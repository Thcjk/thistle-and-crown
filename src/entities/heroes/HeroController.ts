import type { Hero } from "./Hero";
import type { InputFrame } from "@/engine/InputManager";
import type { MatchManager } from "@/match/MatchManager";

/**
 * Player-facing command translator. MatchManager currently owns this flow;
 * extracted here for alternative control schemes later.
 */
export class HeroController {
  apply(hero: Hero, input: InputFrame, match: MatchManager): void {
    if (!hero.isPlayer) return;
    match.handleInput(input);
  }
}
