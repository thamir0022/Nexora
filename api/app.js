import express from "express";
import { PORT } from "./utils/env.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import instructorRoutes from "./routes/instructor.route.js";
import userRoutes from "./routes/user.routes.js";
import { connectMongodb } from "./config/mongodb.js";
import { globalErrorHandler } from "./middlewares/globalmiddleware.js";
import cookieParser from "cookie-parser";
import cors from 'cors';

const app = express();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nhttp://localhost:${PORT}`);
  connectMongodb();
});

app.use(cors({
  origin: 'http://localhost:5173', // Vite frontend URL
  credentials: true, // if you're using cookies or authorization headers
}));
app.use(express.json());
app.use(cookieParser())
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/instructor", instructorRoutes);
app.use("/api/v1/user", userRoutes);

app.use(globalErrorHandler);