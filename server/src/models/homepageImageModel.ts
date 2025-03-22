import * as dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { v4 as uuidv4 } from "uuid";

// Define the interface for the homepage image document
export interface HomepageImageDocument extends Item {
  imageId: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Create the schema for the homepage image
const homepageImageSchema = new dynamoose.Schema(
  {
    imageId: {
      type: String,
      hashKey: true,
      default: () => uuidv4(),
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

// Create and export the model
export const HomepageImage = dynamoose.model<HomepageImageDocument>(
  "HomepageImage",
  homepageImageSchema
);
