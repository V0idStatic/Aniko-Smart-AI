import supabase from "../app/CONFIG/supaBase";

export interface CropParameter {
  crop_details_id: number;
  crop_name: string;
  crop_categories: string;
  crop_region: string;
  crop_province: string;
  crop_city: string;
  temperature_min?: number;
  temperature_max?: number;
  moisture_min?: number;
  moisture_max?: number;
  ph_level_min?: number;
  ph_level_max?: number;
  nitrogen_min?: number;
  nitrogen_max?: number;
  phosphorus_min?: number;
  phosphorus_max?: number;
  potassium_min?: number;
  potassium_max?: number;
}

// Add the missing functions that your chatbot is trying to import
export async function fetchAllCropParameters(): Promise<CropParameter[]> {
  return CropDataService.getAllCropParameters();
}

export function formatCropDataForAI(crops: CropParameter[]): string {
  if (crops.length === 0) return "No crop data available.";
  
  return `CROP DATABASE (${crops.length} crops):
${crops.map(crop => `
🌱 ${crop.crop_name} (${crop.crop_categories})
- Location: ${crop.crop_region}, ${crop.crop_province}, ${crop.crop_city}
- Temperature: ${crop.temperature_min}°C - ${crop.temperature_max}°C
- pH: ${crop.ph_level_min} - ${crop.ph_level_max}
- Moisture: ${crop.moisture_min}% - ${crop.moisture_max}%
- NPK: N(${crop.nitrogen_min}-${crop.nitrogen_max}), P(${crop.phosphorus_min}-${crop.phosphorus_max}), K(${crop.potassium_min}-${crop.potassium_max}) ppm`).join('\n')}`;
}

export function formatSingleCropForAI(crop: CropParameter): string {
  return `🌱 **${crop.crop_name}** (${crop.crop_categories})

📍 **Location**: ${crop.crop_region}, ${crop.crop_province}, ${crop.crop_city}

🌡️ **Optimal Temperature**: ${crop.temperature_min}°C - ${crop.temperature_max}°C
🧪 **pH Level**: ${crop.ph_level_min} - ${crop.ph_level_max}
💧 **Moisture**: ${crop.moisture_min}% - ${crop.moisture_max}%

🧬 **Nutrient Requirements (NPK)**:
- Nitrogen: ${crop.nitrogen_min} - ${crop.nitrogen_max} ppm
- Phosphorus: ${crop.phosphorus_min} - ${crop.phosphorus_max} ppm  
- Potassium: ${crop.potassium_min} - ${crop.potassium_max} ppm

This crop grows well in ${crop.crop_region} region! 🌾`;
}

export class CropDataService {
  // Fetch all crop parameters from denormalized table
  static async getAllCropParameters(): Promise<CropParameter[]> {
    try {
      const { data, error } = await supabase
        .from('denormalized_crop_parameter')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching crop parameters:', error);
      return [];
    }
  }

  // Get crop parameters for specific region
  static async getCropsByRegion(region: string): Promise<CropParameter[]> {
    try {
      const { data, error } = await supabase
        .from('denormalized_crop_parameter')
        .select('*')
        .eq('crop_region', region);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching crops by region:', error);
      return [];
    }
  }

  // Search crops by name
  static async searchCropsByName(searchTerm: string): Promise<CropParameter[]> {
    try {
      const { data, error } = await supabase
        .from('denormalized_crop_parameter')
        .select('*')
        .ilike('crop_name', `%${searchTerm}%`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching crops:', error);
      return [];
    }
  }

  // Get specific crop parameters
  static async getCropByName(cropName: string): Promise<CropParameter | null> {
    try {
      const { data, error } = await supabase
        .from('denormalized_crop_parameter')
        .select('*')
        .eq('crop_name', cropName)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching crop by name:', error);
      return null;
    }
  }
}