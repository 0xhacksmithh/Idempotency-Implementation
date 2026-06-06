import { createPayment } from "../services/payment.services.js";
import { redis } from "../redis/redis.js";

export async function payment(req, res) {
  const { amount, currency, customerId, shouldfail } = req.body;
  const { key, reqHash, redisKey } = req.idempotency;

  // console.log("From controller");
  // console.log(`{
  //   shouldFail: ${shouldfail}
  //   key: ${key},
  //   reqhash: ${reqHash},
  //   redisKey: ${redisKey}
  //   `);

  try {
    const result = await createPayment({
      amount,
      currency,
      customerId,
      idempotencyKey: key,
      reqHash,
      shouldfail,
    });

    await redis.set(
      redisKey,
      JSON.stringify({
        reqHash,
        status: "completed",
        statusCode: result.statusCode,
        response: result.response,
      }),
      "EX",
      86400,
    );

    return res.status(result.statusCode).json(result.response);
  } catch (error) {
    await redis.del(redisKey);

    return res.status(500).json({
      error: error.message,
    });
  }
}
