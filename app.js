import express from "express";
import paymentRoutes from "./routes/payment.routes.js";
import { config } from "dotenv";

//config();
const app = express();
app.use(express.json());
config();

const PORT = process.env.SERVER_PORT;

app.use("/api", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server Running On PORT :: ${PORT}`);
});

// docker run --name my-redis -p 6379:6379 -d redis

// docker run --name my-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=payments -p 5432:5432 -d postgres:16
