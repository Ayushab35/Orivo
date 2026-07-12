import app from "./app";
import logger from "./logger";
import { config } from "./config";

const port = config.port;

app.listen(port, () => {
  logger.info(`Orivo backend listening on http://localhost:${port}`);
});
