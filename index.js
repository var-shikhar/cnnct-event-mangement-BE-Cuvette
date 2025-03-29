import cookieParser from "cookie-parser";
import cors from "cors";
import { configDotenv } from 'dotenv';
import express from 'express';
import connectDB from './middleware/db.js';

configDotenv();

const { PORT, FRONTEND_PORT, RENDER_FRONTED_PORT, DEV_FRONTEND_PORT } = process.env;
const SERVER_PORT = PORT || 3000;
const app = express();
await connectDB();

// Parser for Parsing JSON and Cookie
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: [FRONTEND_PORT, RENDER_FRONTED_PORT, DEV_FRONTEND_PORT],
        credentials: true,
    })
);

import errorMiddleware from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/auth.js";
import eventRoutes from './routes/events.js';

app.use("/auth", authRoutes);
app.use('/event', eventRoutes);

// Error Middleware
app.use(errorMiddleware);


// Connect to MongoDB and start the server
connectDB()
    .then(() => app.listen(SERVER_PORT, () => console.log(`Server running on port ${SERVER_PORT}`)))
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err.message);
        process.exit(1);
    });