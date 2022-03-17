import config from "./configs/index.js";
import server from "./http/index.js";
import { logger } from "./utils/index.js";

server
  .listen(config.port)
  .on("listening", () => logger.info(`server running at ${config.port}`));
