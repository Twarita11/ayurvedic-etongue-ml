import axios from 'axios';
import { SensorReading, PredictionResult, HistoricalData } from '../types';

const API_URL = 'http://localhost:8000';

export const api = {
  async getStatus() {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  },

  async predict(reading: SensorReading): Promise<PredictionResult> {
    const response = await axios.post(`${API_URL}/api/predict`, reading);
    return response.data;
  },

  async getHistory(): Promise<HistoricalData> {
    const response = await axios.get(`${API_URL}/api/history`);
    return response.data;
  }
};