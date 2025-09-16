import { Box, Paper, Typography } from '@mui/material';
import Plot from 'plotly.js-dist-min';
import { useEffect } from 'react';
import { HistoricalData } from '../types';

interface HistoryChartProps {
  data: HistoricalData;
}

export function HistoryChart({ data }: HistoryChartProps) {
  useEffect(() => {
    if (data.readings.length === 0) return;

    // Prepare data for dilution trend
    const dilutionTrace = {
      x: data.readings.map((r) => r.timestamp),
      y: data.predictions.map((p) => p.dilution),
      name: 'Dilution %',
      type: 'scatter',
      mode: 'lines+markers',
    };

    // Prepare data for effectiveness trend
    const effectivenessTrace = {
      x: data.readings.map((r) => r.timestamp),
      y: data.predictions.map((p) => p.effectiveness),
      name: 'Effectiveness',
      type: 'scatter',
      mode: 'lines+markers',
      yaxis: 'y2',
    };

    // Create the plot
    Plot.newPlot('history-chart', [dilutionTrace, effectivenessTrace], {
      title: 'Historical Trends',
      xaxis: { title: 'Time' },
      yaxis: { title: 'Dilution %', side: 'left' },
      yaxis2: {
        title: 'Effectiveness',
        overlaying: 'y',
        side: 'right',
        range: [0, 1],
      },
      showlegend: true,
      height: 400,
    });

    // Create medicine type distribution
    const medicineCounts = data.predictions.reduce((acc, p) => {
      acc[p.medicine] = (acc[p.medicine] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = [{
      values: Object.values(medicineCounts),
      labels: Object.keys(medicineCounts),
      type: 'pie',
    }];

    Plot.newPlot('medicine-dist', pieData, {
      title: 'Medicine Type Distribution',
      height: 400,
    });

    // Cleanup
    return () => {
      Plot.purge('history-chart');
      Plot.purge('medicine-dist');
    };
  }, [data]);

  if (data.readings.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No historical data available</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <div id="history-chart" />
      </Paper>
      <Paper sx={{ p: 3 }}>
        <div id="medicine-dist" />
      </Paper>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Summary Statistics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2">Dilution</Typography>
            <Typography>
              Mean: {data.summary.dilution.mean.toFixed(1)}%
            </Typography>
            <Typography>
              Std Dev: {data.summary.dilution.std.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Effectiveness</Typography>
            <Typography>
              Mean: {(data.summary.effectiveness.mean * 100).toFixed(1)}%
            </Typography>
            <Typography>
              Std Dev: {(data.summary.effectiveness.std * 100).toFixed(2)}%
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}