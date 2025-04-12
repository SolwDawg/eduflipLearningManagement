import { Express } from "express";

// Export a function to log routes that takes the app instance as a parameter
export const logRoutes = (app: any): void => {
  console.log("=== REGISTERED ROUTES ===");
  try {
    if (app._router && app._router.stack) {
      const routes: Array<{ path: string; methods: string }> = [];
      app._router.stack.forEach(function (middleware: any) {
        if (middleware.route) {
          // routes registered directly on the app
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods).join(","),
          });
        } else if (middleware.name === "router") {
          // router middleware
          middleware.handle.stack.forEach(function (handler: any) {
            const route = handler.route;
            if (route) {
              routes.push({
                path: middleware.regexp.toString() + route.path,
                methods: Object.keys(route.methods).join(","),
              });
            }
          });
        }
      });
      console.log(
        "Available Routes:",
        routes.map((r) => `${r.methods.toUpperCase()}: ${r.path}`).sort()
      );

      // Check specifically for quiz results routes
      const quizRoutes = routes.filter((r) => r.path.includes("quiz-results"));
      console.log(
        "Quiz Results Routes:",
        quizRoutes.map((r) => `${r.methods.toUpperCase()}: ${r.path}`).sort()
      );
    } else {
      console.log("App router not available for inspection");
    }
  } catch (error) {
    console.error("Error inspecting routes:", error);
  }
  console.log("=========================");
};

export default { logRoutes };
