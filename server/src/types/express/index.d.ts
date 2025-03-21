// Type definitions for Express
import express from "express";

declare module "express-serve-static-core" {
  interface Request {
    language: string;
  }
}
