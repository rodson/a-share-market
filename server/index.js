import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import { getWindAData } from './windDataService.js';
import { getRealWindAData } from './realDataService.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// 配置：使用真实数据还是模拟数据
// 设置环境变量 USE_REAL_DATA=true 来启用真实数据
const USE_REAL_DATA = process.env.USE_REAL_DATA === 'true';

console.log(`🔧 数据源模式: ${USE_REAL_DATA ? '真实数据（AKShare）' : '模拟数据'}`);

// 创建缓存实例，缓存时间5分钟
const cache = new NodeCache({ stdTTL: 300 });

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

    // 检查缓存
    const cacheKey = `market_data_${date}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit for ${date}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // 获取新数据
    console.log(`Fetching data for ${date} (${USE_REAL_DATA ? 'Real' : 'Mock'})`);
    
    let data;
    try {
      if (USE_REAL_DATA) {
        // 使用真实数据
        data = await getRealWindAData(date);
      } else {
        // 使用模拟数据
        data = await getWindAData(date);
      }
    } catch (error) {
      // 如果真实数据获取失败，回退到模拟数据
      if (USE_REAL_DATA) {
        console.warn('真实数据获取失败，使用模拟数据:', error.message);
        data = await getWindAData(date);
      } else {
        throw error;
      }
    }
    
    // 存入缓存
    cache.set(cacheKey, data);
    
    res.json({
      success: true,
      data,
      cached: false,
      dataSource: USE_REAL_DATA ? 'real' : 'mock'
    });
  } catch (error) {
    console.error('API Error:', error.message);
    
    res.status(500).json({ 
      success: false,
      message: '获取数据失败',
      error: error.message 
    });
  }
});

// 清空缓存API
app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({ success: true, message: '缓存已清空' });
});

// 查看缓存统计API
app.get('/api/cache/stats', (req, res) => {
  const stats = cache.getStats();
  res.json({ 
    success: true, 
    stats: {
      keys: cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is healthy',
    dataSource: USE_REAL_DATA ? 'real' : 'mock',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/market-data?date=YYYY-MM-DD`);
});
