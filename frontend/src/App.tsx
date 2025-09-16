import {
    AppBar,
    Box,
    CircularProgress,
    Container,
    Tab,
    Tabs,
    Toolbar,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from './api';
import { HistoryChart } from './components/HistoryChart';
import { PredictionForm } from './components/PredictionForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState(0);
  const { data: status } = useQuery('status', api.getStatus);
  const { data: history, isLoading } = useQuery('history', api.getHistory, {
    refetchInterval: 5000,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Ayurvedic E-tongue Analysis
          </Typography>
          {status && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                API: {status.status}
              </Typography>
              <Typography variant="body2">
                Models: {status.models_loaded ? '✓' : '✗'}
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Analysis" />
            <Tab label="History" />
          </Tabs>
        </Box>

        <TabPanel value={tab} index={0}>
          <PredictionForm />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : history ? (
            <HistoryChart data={history} />
          ) : null}
        </TabPanel>
      </Container>
    </Box>
  );
}

export default App;
