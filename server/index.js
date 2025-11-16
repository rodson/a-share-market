import express from 'express';
import cors from 'cors';
import { getMarketData } from './dataService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 获取市场数据API
app.get('/api/market-data', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: '请提供日期参数',
        error: 'Missing required parameter: date'
      });
    }

    const data = await getMarketData(date);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('API Error:', error.message);
    
    // 根据错误类型返回不同的状态码和消息
    if (error.message.includes('WindPy')) {
      return res.status(503).json({ 
        success: false,
        message: 'Wind API 未配置',
        error: error.message,
        hint: '请安装 Wind 金融终端和 WindPy，或查看 WIND_API_SETUP.md 了解详情'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: '获取数据失败',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
