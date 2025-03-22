import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import serverless from "serverless-http";
import seed from "./seed/seedDynamodb";
import {
  clerkMiddleware,
  createClerkClient,
  requireAuth,
} from "@clerk/express";
/* ROUTE IMPORTS */
import courseRoutes from "./routes/courseRoutes";
import userClerkRoutes from "./routes/userClerkRoutes";
import enrollmentRoutes from "./routes/enrollmentRoutes";
import userCourseProgressRoutes from "./routes/userCourseProgressRoutes";
import gradeRoutes from "./routes/gradeRoutes";
import discussionRoutes from "./routes/discussionRoutes";
import quizRoutes from "./routes/quizRoutes";
import chatRoutes from "./routes/chatRoutes";

/* CONFIGURATIONS */
dotenv.config();
const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  dynamoose.aws.ddb.local();
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Enhanced CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://eduflip-learning-management.vercel.app",
            "https://eduflip.com",
            /\.eduflip\.com$/,
          ]
        : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Headers",
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Additional CORS handling for S3 pre-flight requests
app.options("*", cors());

app.use(clerkMiddleware());

/* ROUTES */
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.use("/courses", courseRoutes);
app.use("/users/clerk", requireAuth(), userClerkRoutes);
app.use("/enrollments", requireAuth(), enrollmentRoutes);
app.use("/users/course-progress", requireAuth(), userCourseProgressRoutes);
app.use("/grades", requireAuth(), gradeRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/discussion", discussionRoutes);
app.use("/quizzes", quizRoutes);
app.use("/api/chats", requireAuth(), chatRoutes);

/* SERVER */
const port = process.env.PORT || 3000;
if (!isProduction) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// aws production environment
const serverlessApp = serverless(app);
export const handler = async (event: any, context: any) => {
  if (event.action === "seed") {
    await seed();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data seeded successfully" }),
    };
  } else {
    return serverlessApp(event, context);
  }
};
