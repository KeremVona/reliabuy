import { Request, Response } from "express";
import * as propertyService from "../../services/property/propertyService";
import { Property } from "src/interfaces/IProperty";

// MAKE
export async function makeProperty(req: Request, res: Response): Promise<void> {
  try {
    const propertyData: Property = req.body;
    const newProperty = await propertyService.makeProperty(propertyData);

    res.status(201).json({
      success: true,
      data: newProperty,
    });
  } catch (error) {
    console.error("Error making property:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// READ
export async function getProperty(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const property = await propertyService.getPropertyById(id);

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
    const id = parseInt(req.params.id as string, 10);
    const propertyData: Property = req.body;

    const updatedProperty = await propertyService.updateProperty(
      id,
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
    const id = parseInt(req.params.id as string, 10);
    const isDeleted = await propertyService.deleteProperty(id);

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
