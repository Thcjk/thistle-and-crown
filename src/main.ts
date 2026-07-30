import "@/styles/global.css";
import "@/styles/menu.css";
import "@/styles/hud.css";
import { App } from "@/app/App";
import { logger } from "@/utils/logger";

const app = new App();

void app.start().catch((error) => {
  logger.error("Main", "Unhandled startup failure", error);
});

window.addEventListener("beforeunload", () => {
  app.dispose();
});
