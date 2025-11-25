import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import convertRoute from "./routes/convert.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" })); // adjust size if needed

app.use("/api/convert", convertRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});