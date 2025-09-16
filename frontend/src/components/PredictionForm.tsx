import { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { SensorReading, PredictionResult } from '../types';
import { api } from '../api';

const initialReading: SensorReading = {
  temperature: 25.3,
  as7263_r: 0.56,
  as7263_s: 0.48,
  as7263_t: 0.61,
  as7263_u: 0.42,
  as7263_v: 0.39,
  as7263_w: 0.51,
};

export function PredictionForm() {
  const [reading, setReading] = useState<SensorReading>(initialReading);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const prediction = await api.predict(reading);
      setResult(prediction);
    } catch (error) {
      console.error('Prediction error:', error);
    }
    setLoading(false);
  };

  const handleChange = (field: keyof SensorReading) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setReading((prev) => ({
      ...prev,
      [field]: parseFloat(e.target.value),
    }));
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sensor Readings
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <TextField
            label="Temperature"
            type="number"
            value={reading.temperature}
            onChange={handleChange('temperature')}
            required
            inputProps={{ step: 0.1 }}
          />
          <TextField
            label="R Channel"
            type="number"
            value={reading.as7263_r}
            onChange={handleChange('as7263_r')}
            required
            inputProps={{ step: 0.01 }}
          />
          <TextField
            label="S Channel"
            type="number"
            value={reading.as7263_s}
            onChange={handleChange('as7263_s')}
            required
            inputProps={{ step: 0.01 }}
          />
          <TextField
            label="T Channel"
            type="number"
            value={reading.as7263_t}
            onChange={handleChange('as7263_t')}
            required
            inputProps={{ step: 0.01 }}
          />
          <TextField
            label="U Channel"
            type="number"
            value={reading.as7263_u}
            onChange={handleChange('as7263_u')}
            required
            inputProps={{ step: 0.01 }}
          />
          <TextField
            label="V Channel"
            type="number"
            value={reading.as7263_v}
            onChange={handleChange('as7263_v')}
            required
            inputProps={{ step: 0.01 }}
          />
          <TextField
            label="W Channel"
            type="number"
            value={reading.as7263_w}
            onChange={handleChange('as7263_w')}
            required
            inputProps={{ step: 0.01 }}
          />
        </Box>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </Box>

      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Dilution</Typography>
              <Typography variant="h5">{result.dilution.toFixed(1)}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Confidence: {(result.confidence.dilution * 100).toFixed(1)}%
              </Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Medicine</Typography>
              <Typography variant="h5">{result.medicine}</Typography>
              <Typography variant="body2" color="text.secondary">
                Confidence: {(result.confidence.medicine * 100).toFixed(1)}%
              </Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Effectiveness</Typography>
              <Typography variant="h5">
                {(result.effectiveness * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confidence: {(result.confidence.effectiveness * 100).toFixed(1)}%
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}
    </Paper>
  );
}