import { db } from "../db/postgres.js";
import { chargeCard } from "../services/fakeGateway.services.js";
import { randomUUID } from "crypto";

export async function createPayment({
  amount,
  currency,
  customerId,
  idempotencyKey,
  reqHash,
  shouldfail,
}) {
  const client = await db.connect();
  // console.log(`From Payment service`);
  // console.log(`
  //   {
  //     amount: ${amount},
  // currency: ${currency}
  // customerId: ${customerId}
  // idempotencyKey: ${idempotencyKey}
  // requestHash: ${reqHash}
  // shouldfail: ${shouldfail}
  //   }
  //   `);

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
            SELECT response, status_code
            FROM idempotency_keys
            WHERE idem_key = $1
            `,
      [idempotencyKey],
    );

    if (existing.rows.length) {
      await client.query(`ROLLBACK`);

      return {
        replayed: true,
        response: existing.rows[0].response,
        statusCode: existing.rows[0].status_code,
      };
    }

    const gateWayResponse = await chargeCard({
      amount,
      shouldfail,
    });

    const paymentId = randomUUID();

    const paymentInsert = await client.query(
      `
            INSERT INTO payments(
              id,
              amount,
              currency,
              customer_id,
              gate_tx_id,
              tx_status,
              idempotency_key
            )
            VALUES($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
      [
        paymentId,
        amount,
        currency,
        customerId,
        gateWayResponse.transactionId,
        "SUCCESS",
        idempotencyKey,
      ],
    );

    const response = {
      paymentId,
      transactionId: gateWayResponse.transactionId,
      amount,
      currency,
      status: "SUCCESS",
    };

    await client.query(
      `
            INSERT INTO idempotency_keys(
                idem_key,
                request_hash,
                tx_status,
                status_code,
                response
            )
            VALUES($1, $2, $3, $4, $5)
            `,
      [idempotencyKey, reqHash, "completed", 201, JSON.stringify(response)],
    );

    await client.query("COMMIT");

    return {
      replayed: false,
      response,
      statusCode: 201,
    };
  } catch (error) {
    await client.query(`ROLLBACK`);
    //    console.log(`Rolled Backed`)
    throw error;
  } finally {
    client.release();
    //    console.log(`client released`);
  }
}
