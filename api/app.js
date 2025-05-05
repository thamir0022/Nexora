import express from "express";
import { PORT } from "./utils/env.js";

const app = express();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nhttp://localhost:${PORT}`);
});
