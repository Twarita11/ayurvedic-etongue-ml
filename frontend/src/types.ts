export interface SensorReading {
  timestamp?: string;
  temperature: number;
  as7263_r: number;
  as7263_s: number;
  as7263_t: number;
  as7263_u: number;
  as7263_v: number;
  as7263_w: number;
}

export interface PredictionResult {
  dilution: number;
  medicine: string;
  effectiveness: number;
  confidence: {
    dilution: number;
    medicine: number;
    effectiveness: number;
  };
}

export interface HistoricalData {
  readings: SensorReading[];
  predictions: PredictionResult[];
  summary: {
    dilution: {
      mean: number;
      std: number;
    };
    effectiveness: {
      mean: number;
      std: number;
    };
  };
}