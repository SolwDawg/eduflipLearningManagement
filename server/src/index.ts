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
import categoryRoutes from "./routes/categoryRoutes";
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
app.use(cors());
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
app.use("/categories", categoryRoutes);
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
