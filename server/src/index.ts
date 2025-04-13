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
import {
  ClerkExpressRequireAuth,
  ClerkExpressWithAuth,
} from "@clerk/clerk-sdk-node";
import AWS from "aws-sdk";
import rateLimit from "express-rate-limit";
import logger from "./config/logger";
import { getMonthlyLeaderboard } from "./controllers/userCourseProgressController";
import { flexibleAuth } from "./middleware/auth";
/* ROUTE IMPORTS */
import courseRoutes from "./routes/courseRoutes";
import userClerkRoutes from "./routes/userClerkRoutes";
import enrollmentRoutes from "./routes/enrollmentRoutes";
import userCourseProgressRoutes from "./routes/userCourseProgressRoutes";
import gradeRoutes from "./routes/gradeRoutes";
import discussionRoutes from "./routes/discussionRoutes";
import quizRoutes from "./routes/quizRoutes";
import chatRoutes from "./routes/chatRoutes";
import homepageImageRoutes from "./routes/homepageImageRoutes";
import commentRoutes from "./routes/commentRoutes";
import teacherRoutes from "./routes/teacherRoutes";
import { logRoutes } from "./routes/index";

/* CONFIGURATIONS */
dotenv.config();
const isProduction = process.env.NODE_ENV === "production";

// Configure DynamoDB
try {
  if (isProduction) {
    // In production, use the AWS_REGION environment variable
    const region = process.env.AWS_REGION || "ap-southeast-1";

    console.log(`Configuring DynamoDB for production in region: ${region}`);

    // Configure AWS SDK
    AWS.config.update({
      region,
      maxRetries: 5,
      httpOptions: { timeout: 5000, connectTimeout: 5000 },
    });

    // Create a custom DynamoDB instance with our configuration
    const ddb = new AWS.DynamoDB({
      apiVersion: "2012-08-10",
      region,
      maxRetries: 5,
    });

    // For dynamoose v3+, use the local method to specify the endpoint if needed
    // No need to do anything special if we're using AWS credentials from environment
    // or instance profile as they'll be picked up automatically

    console.log("DynamoDB configured for production");
  } else {
    // In development, use local DynamoDB
    console.log("Configuring DynamoDB for local development");
    dynamoose.aws.ddb.local();
    console.log("Using local DynamoDB instance");
  }
} catch (error) {
  console.error("Error configuring DynamoDB:", error);
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// CORS configuration with more permissive settings
const corsOptions = {
  origin: "*", // Allow requests from any origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-User-ID"],
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(clerkMiddleware());

/* ROUTES */
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.use("/courses", courseRoutes);
app.use("/users/clerk", requireAuth(), userClerkRoutes);
app.use("/enrollments", requireAuth(), enrollmentRoutes);
app.use("/users/course-progress", requireAuth(), userCourseProgressRoutes);
app.use("/api/progress", flexibleAuth(), userCourseProgressRoutes);
app.use("/grades", requireAuth(), gradeRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/discussion", discussionRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/quizzes", quizRoutes);
app.use("/api/chats", requireAuth(), chatRoutes);
app.use("/api/homepage-images", homepageImageRoutes);
app.use("/comments", commentRoutes);
app.use("/api/teachers", requireAuth(), teacherRoutes);

// Public endpoint for monthly leaderboard
app.get("/api/public/leaderboard/monthly", getMonthlyLeaderboard);

// Log all registered routes
logRoutes(app);

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
  try {
    console.log(
      "Lambda handler invoked with event:",
      JSON.stringify(event, null, 2)
    );

    // Configure AWS SDK for this invocation
    AWS.config.update({
      region: process.env.AWS_REGION || "ap-southeast-1",
      maxRetries: 3,
      httpOptions: { timeout: 10000 },
    });

    if (event.action === "seed") {
      await seed();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Data seeded successfully" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Requested-With",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
      };
    } else {
      try {
        const response = await serverlessApp(event, context);
        console.log("Lambda handler completed successfully");
        return response;
      } catch (expressError) {
        console.error("Express application error:", expressError);

        // Enhanced error details
        let errorMessage = "Internal server error";
        let errorDetails = "";

        if (expressError instanceof Error) {
          errorMessage = expressError.message;
          errorDetails = expressError.stack || "";
          console.error("Error name:", expressError.name);
          console.error("Error message:", expressError.message);
          console.error("Error stack:", expressError.stack);
        }

        // Check for common DynamoDB errors
        if (
          errorMessage.includes("ResourceNotFoundException") ||
          errorMessage.includes("Cannot do operations on a non-existent table")
        ) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              message: "Resource not found",
              error: "Table does not exist or resource not found",
              request_id: context.awsRequestId,
            }),
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":
                "Content-Type,Authorization,X-Requested-With",
              "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            },
          };
        }

        // Check for credential errors
        if (
          errorMessage.includes("credentials") ||
          errorMessage.includes("Credentials")
        ) {
          return {
            statusCode: 500,
            body: JSON.stringify({
              message: "AWS credentials error",
              error: "Invalid or missing credentials",
              request_id: context.awsRequestId,
            }),
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":
                "Content-Type,Authorization,X-Requested-With",
              "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            },
          };
        }

        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Internal server error",
            error: errorMessage,
            request_id: context.awsRequestId,
            timestamp: new Date().toISOString(),
            path: event.path,
          }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":
              "Content-Type,Authorization,X-Requested-With",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          },
        };
      }
    }
  } catch (error) {
    console.error("Lambda handler uncaught error:", error);

    // Ensure we always return a response, even for uncaught errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        path: event?.path || "/unknown",
        request_id: context?.awsRequestId,
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Requested-With",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      },
    };
  }
};
