import { GAME_NAME, GAME_VERSION } from "@/utils/constants";

export const AppConfig = {
  name: GAME_NAME,
  version: GAME_VERSION,
  debug: import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true",
  basePath: import.meta.env.BASE_URL || "/",
} as const;
