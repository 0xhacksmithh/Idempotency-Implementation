import crypto from "crypto";

export const hashbody = (body) => {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
};
