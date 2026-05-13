import { NextFunction, Request, Response } from "express";
import * as propertyService from "../../services/property/propertyService";
import { Property } from "../../interfaces/IProperty";

// MAKE
export async function makeProperty(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Authorization Check (401)
    // Avoid the non-null assertion (!) if possible. Validate explicitly so tests can catch it.
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user context.",
      });
      return;
    }

    // 3. Payload Validation Check (400)
    // Prevent NaN from entering your database if req.body.price is missing or malformed.
    const price = Number(req.body.price);
    if (isNaN(price) || price < 0) {
      res.status(400).json({
        success: false,
        message: "Bad Request: A valid positive price is required.",
      });
      return;
    }

    // 4. Data Transformation
    const files = req.files as Express.Multer.File[];
    const imageUrls = files.map((file) => `/uploads/${file.filename}`);

    const propertyData = {
      ...req.body,
      user_id: parseInt(req.user.id, 10), // Always pass radix 10 to parseInt
      price: price,
      images: imageUrls,
    };

    // 5. Database / Service Call
    const newProperty = await propertyService.makeProperty(propertyData);

    // 6. Success Response (201)
    res.status(201).json({ success: true, data: newProperty });
  } catch (error) {
    console.error("Error making property:", error);

    // Optional: Differentiate between service/validation errors and actual server crashes
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    // 7. Server Error (500)
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// READ
export async function getProperty(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const sliced = id.slice(1);
    const propertyId = parseInt(sliced as string, 10);

    if (isNaN(propertyId)) {
      res.status(400).json({ error: "Invalid Property ID provided" });
      //return;
    }
    const property = await propertyService.getPropertyById(propertyId);

    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    res.status(200).json({ success: true, data: property });
  } catch (error) {
    console.error(`Error fetching property ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// READ ALL
export async function getAllProperties(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const properties = await propertyService.getAllProperties();
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.error("Error fetching all properties:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// UPDATE
export async function updateProperty(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;
    const sliced = id.slice(1);
    const propertyId = parseInt(sliced as string, 10);

    const propertyData: Property = req.body;

    if (isNaN(propertyId)) {
      res.status(400).json({ error: "Invalid Property ID provided" });
      //return;
    }

    const existingProperty = await propertyService.getPropertyById(propertyId);

    if (!existingProperty) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    if (existingProperty.user_id !== parseInt(req.user!.id)) {
      res.status(403).json({
        success: false,
        message: "Unauthorized: You can only edit your own properties.",
      });
      return;
    }

    const updatedProperty = await propertyService.updateProperty(
      propertyId,
      propertyData,
    );

    if (!updatedProperty) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    res.status(200).json({ success: true, data: updatedProperty });
  } catch (error) {
    console.error(`Error updating property ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// DELETE
export async function deleteProperty(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const propertyId = parseInt(id as string, 10);

    // Check if the ID is actually a valid number before calling the service
    if (isNaN(propertyId)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid property ID format" });
      return;
    }
    console.log("propertyId: ", typeof propertyId, id);

    const existingProperty = await propertyService.getPropertyById(propertyId);
    //console.log("Attempting deletion of: ", existingProperty);
    //console.log(req.user);
    //console.log(
    //  "Comparing: ",
    //  existingProperty!.user_id,
    //  parseInt(req.user!.id),
    //);

    if (!existingProperty) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    if (!req.user || existingProperty.user_id !== parseInt(req.user.id)) {
      res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own properties.",
      });
      return;
    }

    if (existingProperty.user_id !== parseInt(req.user!.id)) {
      res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own properties.",
      });
      return;
    }

    const isDeleted = await propertyService.deleteProperty(propertyId);
    //console.log(propertyId);

    if (!isDeleted) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    res
      .status(200)
      .json({ success: true, message: "Property deleted successfully" });
  } catch (error) {
    console.error(`Error deleting property ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export const handleSearch = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    //console.log("before return");

    if (!q) {
      return res.status(400).json({ message: "Search term is required" });
    }

    const properties = await propertyService.searchProperties(q as string);
    //console.log("properties: ", properties);

    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.error(`Error searching property:`, error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyProperties = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found in request",
      });
    }

    const properties = await propertyService.getUserProperties(
      parseInt(userId),
    );

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const saveProperty = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = parseInt(req.user!.id, 10);
    const propertyId = parseInt(req.params.id as string, 10);

    if (isNaN(propertyId)) {
      res.status(400).json({ success: false, message: "Invalid property ID" });
      return;
    }

    await propertyService.addFavorite(userId, propertyId);

    res
      .status(200)
      .json({ success: true, message: "Property saved to favorites" });
  } catch (error) {
    console.error("Error saving property:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const unsaveProperty = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = parseInt(req.user!.id, 10);
    const propertyId = parseInt(req.params.id as string, 10);

    if (isNaN(propertyId)) {
      res.status(400).json({ success: false, message: "Invalid property ID" });
      return;
    }

    await propertyService.removeFavorite(userId, propertyId);

    res
      .status(200)
      .json({ success: true, message: "Property removed from favorites" });
  } catch (error) {
    console.error("Error removing saved property:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMySavedProperties = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = parseInt(req.user!.id, 10);
    const savedProperties = await propertyService.getSavedProperties(userId);

    res.status(200).json({
      success: true,
      count: savedProperties.length,
      data: savedProperties,
    });
  } catch (error) {
    console.error("Error fetching saved properties:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAIDescription = async (req: any, res: any) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ error: "No images provided for scanning." });
    }

    const description = await propertyService.generatePropertyDescription(
      req.files as Express.Multer.File[],
    );
    res.status(200).json({ description });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate description with AI." });
  }
};

// NOTE: Disabled for now

//export const searchProperties = async (req: Request, res: Response) => {
//  try {
//    // Extract query parameters
//    const { title, city, minPrice, maxPrice } = req.query;
//
//    // Convert strings to numbers where necessary
//    const filters = {
//      title: title as string,
//      city: city as string,
//      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
//      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
//    };
//
//    const results = await propertyService.findProperties(filters);
//
//    res.status(200).json({
//      success: true,
//      count: results.length,
//      data: results,
//    });
//  } catch (error) {
//    res.status(500).json({ success: false, message: "Search failed" });
//  }
//};
