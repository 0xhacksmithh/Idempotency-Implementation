import { hashbody } from "../utils/hash.js";
import { redis } from "../redis/redis.js";

const TTL = 24 * 60 * 60; // 24HR

export async function idempotency(req, res, next) {
  // Get Idempotency Key Or Return Error Msg
  const key = req.header("Idempotency-Key");
  if (!key) {
    return res.status(400).json({
      message: "Idempotemcy-Key Not Found.",
    });
  }

  // Hashing req body
  const reqHash = hashbody(req.body);

  // Checking Redis Cache
  const redisKey = `idem:${key}`;
  const cached = await redis.get(redisKey);

  // if Cache Exists Sending According Msg
  if (cached) {
    const parsed = JSON.parse(cached);

    if (parsed.reqHash !== reqHash) {
      return res.status(422).json({
        error: "Request Body Mismatched",
      });
    }

    if (parsed.status === "completed") {
      return res.status(parsed.statusCode).json(parsed.response);
    }

    if (parsed.status === "processing") {
      res.status(409).json({
        error: "Payment Already Processing",
      });
    }
  }

  // Locking Before Caching To Handel Concurrent Requests. On SUCCESS --> OK, On Failure --> Null
  const lock = await redis.set(
    `${redisKey}:lock`,
    "1",
    "NX", // if not exists
    "EX", // expiry
    30,
  );

  if (!lock) {
    return res.status(409).json({
      error: "Duplicate Requests.",
    });
  }

  await redis.set(
    redisKey,
    JSON.stringify({
      reqHash,
      status: "processing",
    }),
    "EX",
    TTL,
  );

  req.idempotency = {
    key,
    reqHash,
    redisKey,
  };

  next();
}
