import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import { getWindAData } from './windDataService.js';
import { getRealWindAData } from './realDataService.js';
import { getWindRealData } from './windRealService.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// 配置：数据源模式
// USE_REAL_DATA: 使用 AKShare 数据
// USE_WIND_API: 使用 WindPy 接口 (优先级更高)
const USE_REAL_DATA = process.env.USE_REAL_DATA === 'true';
const USE_WIND_API = process.env.USE_WIND_API === 'true';

console.log(`🔧 数据源配置: Real=${USE_REAL_DATA}, Wind=${USE_WIND_API}`);
let dataSourceLabel = '模拟数据';
if (USE_WIND_API) dataSourceLabel = 'Wind 终端 (Real)';
else if (USE_REAL_DATA) dataSourceLabel = 'AKShare (Real)';

console.log(`🚀 当前模式: ${dataSourceLabel}`);

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
    const cacheKey = `market_data_${date}_${USE_WIND_API ? 'wind' : (USE_REAL_DATA ? 'ak' : 'mock')}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit for ${date}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
        dataSource: USE_WIND_API ? 'wind' : (USE_REAL_DATA ? 'akshare' : 'mock')
      });
    }

    // 获取新数据
    console.log(`Fetching data for ${date} (${dataSourceLabel})`);
    
    let data;
    try {
      if (USE_WIND_API) {
        // 使用 Wind 终端接口 (通过 Python Server)
        // 如果 Python Server 未启动，会捕获异常并自动降级
        try {
          data = await getWindRealData(date);
        } catch (windError) {
          console.error(`Wind Server 调用失败: ${windError.message}`);
          if (USE_REAL_DATA) {
            console.warn('尝试切换到 AKShare...');
            data = await getRealWindAData(date);
          } else {
            console.warn('Wind Server 失败且未启用 AKShare，切换到模拟数据...');
            data = await getWindAData(date);
          }
        }
      } else if (USE_REAL_DATA) {
        // 使用 AKShare 真实数据
        data = await getRealWindAData(date);
      } else {
        // 使用模拟数据
        data = await getWindAData(date);
      }
    } catch (error) {
      console.error(`数据获取失败 (${dataSourceLabel}):`, error.message);
      
      // 降级策略
      if (USE_WIND_API && USE_REAL_DATA) {
        console.warn('Wind 接口失败，尝试切换到 AKShare...');
        try {
          data = await getRealWindAData(date);
        } catch (e) {
          console.warn('AKShare 也失败，切换到模拟数据...');
          data = await getWindAData(date);
        }
      } else if (USE_WIND_API || USE_REAL_DATA) {
        console.warn('真实数据获取失败，使用模拟数据...');
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
      dataSource: USE_WIND_API ? 'wind' : (USE_REAL_DATA ? 'akshare' : 'mock')
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
    dataSource: USE_WIND_API ? 'wind' : (USE_REAL_DATA ? 'akshare' : 'mock'),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/market-data?date=YYYY-MM-DD`);
});
