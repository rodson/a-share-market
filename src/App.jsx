import React, { useState, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  CssBaseline
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DownloadIcon from '@mui/icons-material/Download';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import EquityBondSpread from './components/EquityBondSpread';
import MarketOverview from './components/MarketOverview';
import SectorTable from './components/SectorTable';
import { fetchMarketData } from './services/api';
import 'dayjs/locale/zh-cn';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

function App() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMarketData(selectedDate.format('YYYY-MM-DD'));
      setMarketData(data);
    } catch (err) {
      setError(err.message || '获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleExportImage = async () => {
    if (!contentRef.current) return;
    
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#2d2d2d',
        scale: 2,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `a-share-market-${selectedDate.format('YYYY-MM-DD')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      setError('导出图片失败');
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
        <Box sx={{ minHeight: '100vh', bgcolor: '#1a1a1a' }}>
          {/* 控制栏 */}
          <Box sx={{ bgcolor: '#2d2d2d', p: 2, borderBottom: '1px solid #444' }}>
            <Container maxWidth="lg">
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <DatePicker
                  label="选择日期"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: 'small',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleFetchData}
                  disabled={loading}
                  sx={{ minWidth: 100 }}
                >
                  {loading ? <CircularProgress size={24} /> : '查询数据'}
                </Button>
                {marketData && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportImage}
                  >
                    导出图片
                  </Button>
                )}
              </Box>
            </Container>
          </Box>

          {/* 错误提示 */}
          {error && (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Container>
          )}

          {/* 数据展示区域 */}
          {marketData && (
            <Container maxWidth="lg" sx={{ py: 3 }}>
              <Box ref={contentRef} sx={{ bgcolor: '#5a5a5a', borderRadius: 1, overflow: 'hidden' }}>
                {/* 股债利差分析 */}
                <EquityBondSpread data={marketData.equityBondSpread} />
                
                {/* 市场概况 */}
                <MarketOverview data={marketData.overview} />
                
                {/* 板块数据 */}
                <SectorTable data={marketData.sectors} />
              </Box>
            </Container>
          )}
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
