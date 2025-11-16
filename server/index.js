import express from 'express';
import cors from 'cors';
import { getCachedMarketData, clearCache, getCacheStats } from './cacheService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 获取市场数据API（使用缓存）
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

    const data = await getCachedMarketData(date);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('API Error:', error.message);
    
    // 根据错误类型返回不同的状态码和消息
    if (error.message.includes('AKShare')) {
      return res.status(503).json({ 
        success: false,
        message: 'AKShare 未配置',
        error: error.message,
        hint: '请安装 AKShare: pip install akshare pandas'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: '获取数据失败',
      error: error.message 
    });
  }
});

// 清空缓存API（用于调试）
app.post('/api/cache/clear', (req, res) => {
  clearCache();
  res.json({ success: true, message: '缓存已清空' });
});

// 查看缓存统计API（用于调试）
app.get('/api/cache/stats', (req, res) => {
  const stats = getCacheStats();
  res.json({ success: true, stats });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
