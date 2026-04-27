import { Request, Response } from "express";
import * as propertyService from "../../services/property/propertyService";
import { Property } from "../../interfaces/IProperty";

// MAKE
export async function makeProperty(req: Request, res: Response): Promise<void> {
  try {
    // Multer puts files in req.files
    const files = req.files as Express.Multer.File[];

    // Construct the URLs/Paths to store in the DB
    const imageUrls = files.map((file) => `/uploads/${file.filename}`);

    // propertyData comes from req.body (strings only)
    const propertyData = {
      ...req.body,
      user_id: parseInt(req.user!.id),
      price: Number(req.body.price),
      images: imageUrls, // Pass the local paths to the service
    };

    const newProperty = await propertyService.makeProperty(propertyData);

    res.status(201).json({ success: true, data: newProperty });
  } catch (error) {
    console.error("Error making property:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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
    const sliced = id.slice(1);
    const propertyId = parseInt(sliced as string, 10);

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
