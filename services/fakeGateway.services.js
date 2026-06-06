import { randomUUID } from "crypto";

export async function chargeCard({ amount, shouldfail }) {
  await new Promise((resolve) => {
    setTimeout(resolve, 1500);
  });

  if (shouldfail) {
    throw new Error("Payment Gateway TimeOut");
  }

  return {
    transactionId: randomUUID(),
    amount,
    status: "SUCCESS",
  };
}
