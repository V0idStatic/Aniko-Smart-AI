import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Location type from dashboard
interface PhLocation { 
    region: string;
    province: string; 
    city: string; 
    lat: number; 
    lon: number; 
}

// Crop data type from plant dashboard
interface CropData {
    crop_details_id: number;
    crop_name: string;
    crop_categories: string;
    crop_region: string;
    crop_province: string;
    crop_city: string;
}

// Crop parameter type for sensor monitoring
interface CropParameter {
    crop_param_id: number;
    crop_name: string;
    crop_category: string;
    temperature_min: number;
    temperature_max: number;
    ph_level_min: number;
    ph_level_max: number;
    moisture_min: number;
    moisture_max: number;
    nitrogen_min: number;
    nitrogen_max: number;
    potassium_min: number;
    potassium_max: number;
    phosphorus_min: number;
    phosphorus_max: number;
    soil_moisture_min: number;
    soil_moisture_max: number;
    crop_id: number;
}

// Sensor data type from sensor dashboard
interface SensorData {
    temperature: number;
    moisture: number;
    ec: number;
    ph: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    timestamp: number;
}

interface AppContextType {
    // Location state
    selectedLocation: PhLocation | null;
    setSelectedLocation: (location: PhLocation | null) => void;
    
    // Plant state
    selectedCrop: CropData | null;
    setSelectedCrop: (crop: CropData | null) => void;
    
    // Crop parameters
    cropParameters: CropParameter | null;
    setCropParameters: (params: CropParameter | null) => void;
    
    // Sensor data
    sensorData: SensorData | null;
    setSensorData: (data: SensorData | null) => void;
    
    // Sensor connection state
    isSensorConnected: boolean;
    setIsSensorConnected: (connected: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [selectedLocation, setSelectedLocation] = useState<PhLocation | null>(null);
    const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);
    const [cropParameters, setCropParameters] = useState<CropParameter | null>(null);
    const [sensorData, setSensorData] = useState<SensorData | null>(null);
    const [isSensorConnected, setIsSensorConnected] = useState(false);

    // Log state changes for debugging
    useEffect(() => {
        if (selectedLocation) {
            console.log('Global Location Updated:', selectedLocation.city);
        }
    }, [selectedLocation]);

    useEffect(() => {
        if (selectedCrop) {
            console.log('Global Crop Updated:', selectedCrop.crop_name);
        }
    }, [selectedCrop]);

    useEffect(() => {
        if (sensorData) {
            console.log('Global Sensor Data Updated:', {
                temp: sensorData.temperature,
                ph: sensorData.ph,
                moisture: sensorData.moisture
            });
        }
    }, [sensorData]);

    const value: AppContextType = {
        selectedLocation,
        setSelectedLocation,
        selectedCrop,
        setSelectedCrop,
        cropParameters,
        setCropParameters,
        sensorData,
        setSensorData,
        isSensorConnected,
        setIsSensorConnected,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// Export types for use in other files
export type { PhLocation, CropData, CropParameter, SensorData };