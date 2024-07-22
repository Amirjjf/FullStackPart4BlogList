const app = require("./app");
const cofig = require("./utils/config");
const logger = require("./utils/logger");

app.listen(cofig.PORT, () => {
  logger.info(`Server running on port ${cofig.PORT}`);
});
