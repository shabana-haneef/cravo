import app from "./app.js";

import { env } from "./config/env.js";
import { redis } from "./config/redis.js";

const startServer = async () => {
  try {
    await redis.connect();

    console.log("Redis Connected");

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
};

startServer();