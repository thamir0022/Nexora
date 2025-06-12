import express from "express";
import { PORT } from "./utils/env.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import instructorRoutes from "./routes/instructor.route.js";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { connectMongodb } from "./config/mongodb.js";
import { globalErrorHandler } from "./middlewares/globalmiddleware.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nhttp://localhost:${PORT}`);
  connectMongodb();
});

app.use(
  cors({
    origin: "http://localhost:5173", // Vite frontend URL
    credentials: true, // if you're using cookies or authorization headers
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/instructors", instructorRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.all("/*splat", notFoundHandler);

app.use(globalErrorHandler);
