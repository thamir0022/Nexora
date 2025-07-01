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
import notificationRoutes from "./routes/notification.route.js";
import reviewRoutes from "./routes/review.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import { connectMongodb } from "./config/mongodb.js";
import { globalErrorHandler } from "./middlewares/globalmiddleware.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { initSocketIo } from "./config/socketio.js";
import http from "http";
import { CLIENT_BASE_URL } from "./utils/env.js";
import certificateRoutes from "./routes/certificate.routes.js";
import arcjectMiddleware from "./middlewares/arcjetmiddleware.js";

const app = express();

const server = http.createServer(app);

// Initialize socket.io
initSocketIo(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  connectMongodb();
});

app.use(
  cors({
    origin: CLIENT_BASE_URL, // frontend URL
    credentials: true, // if you're using cookies or authorization headers
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(arcjectMiddleware);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/instructors", instructorRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/certificates", certificateRoutes);
app.all("/*splat", notFoundHandler);

app.use(globalErrorHandler);
