import { highlandValeMap } from "@/data/maps/highlandVale";
import type { MapDefinition } from "@/types/data.types";
import { logger } from "@/utils/logger";

export class MapLoader {
  load(mapId = "highland_vale"): MapDefinition {
    if (mapId !== highlandValeMap.id) {
      logger.warn("MapLoader", `Unknown map ${mapId}, falling back to Highland Vale`);
    }
    // Return a deep-ish copy so match instances cannot mutate shared data.
    return structuredClone(highlandValeMap);
  }
}
