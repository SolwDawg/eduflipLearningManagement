import "@clerk/express";

declare module "@clerk/express" {
  interface AuthObject {
    userName: string;
  }
}
