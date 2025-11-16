import NodeCache from 'node-cache';
import { getMarketData } from './dataService.js';

// 创建缓存实例（5分钟过期）
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// 预加载标记
let isPreloading = false;
let lastPreloadTime = 0;

/**
 * 获取缓存的市场数据
 * @param {string} date - 日期
 * @returns {Promise<Object>} 市场数据
 */
export async function getCachedMarketData(date) {
  const cacheKey = `market_${date}`;
  
  // 1. 尝试从缓存获取
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('✅ 使用缓存数据:', date);
    // 异步更新缓存（不阻塞响应）
    preloadMarketData(date);
    return cached;
  }
  
  // 2. 缓存未命中，获取数据
  console.log('📡 获取新数据:', date);
  const data = await getMarketData(date);
  
  // 3. 存入缓存
  cache.set(cacheKey, data);
  
  // 4. 异步预加载相邻日期（提升后续访问速度）
  preloadAdjacentDates(date);
  
  return data;
}

/**
 * 预加载市场数据（不抛出错误）
 */
async function preloadMarketData(date) {
  const now = Date.now();
  // 避免频繁预加载（至少间隔1分钟）
  if (isPreloading || (now - lastPreloadTime < 60000)) {
    return;
  }
  
  isPreloading = true;
  lastPreloadTime = now;
  
  try {
    const cacheKey = `market_${date}`;
    const data = await getMarketData(date);
    cache.set(cacheKey, data);
    console.log('🔄 后台更新缓存:', date);
  } catch (error) {
    console.log('⚠️ 后台更新失败（不影响服务）:', error.message);
  } finally {
    isPreloading = false;
  }
}

/**
 * 预加载相邻日期数据
 */
function preloadAdjacentDates(date) {
  // 在后台预加载前一天和当天数据
  setTimeout(async () => {
    try {
      const yesterday = getPreviousWorkday(date);
      const today = getToday();
      
      for (const d of [yesterday, today]) {
        const cacheKey = `market_${d}`;
        if (!cache.get(cacheKey)) {
          try {
            const data = await getMarketData(d);
            cache.set(cacheKey, data);
            console.log('🔮 预加载完成:', d);
          } catch (error) {
            // 忽略预加载错误
          }
        }
      }
    } catch (error) {
      // 忽略
    }
  }, 1000);
}

/**
 * 获取前一个工作日
 */
function getPreviousWorkday(dateStr) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  // 简化处理：跳过周末
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() - 2); // 周日 -> 周五
  if (day === 6) date.setDate(date.getDate() - 1); // 周六 -> 周五
  return date.toISOString().split('T')[0];
}

/**
 * 获取今天日期
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 清空缓存
 */
export function clearCache() {
  cache.flushAll();
  console.log('🗑️ 缓存已清空');
}

/**
 * 获取缓存统计
 */
export function getCacheStats() {
  return cache.getStats();
}
