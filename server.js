import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import CategoryRoutes from "./routes/CategoryRoute.js";
import ProductRoutes from "./routes/ProductRoute.js";
import formidable from "express-formidable";
import carouselRoutes from "./routes/carouselRoute.js";
import cors from "cors";
import LikeRoutes from "./routes/likeRoute.js";

// configure env
dotenv.config();

// connect database
connectDB();

// rest object
const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", CategoryRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/carousel", carouselRoutes);
app.use("/api/v1/like", LikeRoutes);

// default route
app.get("/", (req, res) => {
  res.send("Welcome to EComm APP 🚀");
});

export default app;

if (process.env.NODE_ENV !== "production") {

  const PORT = process.env.PORT || 8070;
  app.listen(PORT, () => {
    console.log(`Server Running on PORT: ${PORT}`.bgCyan.white);
  });
}
