import express from 'express';
import cors from 'cors';
import { getMarketData } from './dataService.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 获取市场数据API
app.get('/api/market-data', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: '请提供日期参数' });
    }

    const data = await getMarketData(date);
    res.json(data);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ 
      message: '获取数据失败',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
