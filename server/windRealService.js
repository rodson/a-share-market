/**
 * Wind API 数据服务 (HTTP 客户端版)
 * 调用常驻的 Python Wind Server 获取数据，避免重复启动 Wind 终端
 */

import fetch from 'node-fetch';

// Wind Python Server 地址
const WIND_SERVER_URL = 'http://localhost:5001';

/**
 * 调用 Wind Server API
 * @param {string} endpoint - API 端点
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} API 响应数据
 */
async function callWindServer(endpoint, params = {}) {
  // 构建 URL 参数
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.append(key, value);
  }
  
  const url = `${WIND_SERVER_URL}${endpoint}?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Wind Server API Error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    // 如果是连接被拒绝，可能是服务没启动
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Wind Python Server 未运行 (连接被拒绝: ${WIND_SERVER_URL})。请先运行 'python server/wind_api/wind_server.py' 启动服务。`);
    }
    throw error;
  }
}

/**
 * 获取股债利差数据
 * @param {string} date - 日期 YYYY-MM-DD
 * @returns {Promise<Object>} 股债利差数据
 */
export async function getEquityBondSpread(date) {
  return callWindServer('/api/equity_bond_spread', { date });
}

/**
 * 获取市场概况
 * @param {string} date - 日期 YYYY-MM-DD
 * @returns {Promise<Object>} 市场概况数据
 */
export async function getMarketOverview(date) {
  return callWindServer('/api/market_overview', { date });
}

/**
 * 获取板块数据
 * @param {string} date - 日期 YYYY-MM-DD
 * @returns {Promise<Object>} 板块数据
 */
export async function getSectors(date) {
  return callWindServer('/api/sectors', { date });
}

/**
 * 获取指数数据
 * @param {string} date - 日期 YYYY-MM-DD
 * @returns {Promise<Array>} 指数数据
 */
export async function getIndices(date) {
  // 上证指数, 深证成指, 创业板指, 科创50
  const indices = "000001.SH,399001.SZ,399006.SZ,000688.SH";
  
  const data = await callWindServer('/api/indices', { codes: indices, date });
  
  // 映射名称
  const nameMap = {
    "000001.SH": "上证指数",
    "399001.SZ": "深证成指",
    "399006.SZ": "创业板指",
    "000688.SH": "科创50"
  };
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      name: nameMap[item.code] || item.code,
      changePercent: item.pct_chg,
      volume: item.volume,
      amount: item.amt
    }));
  }
  return [];
}

/**
 * 获取完整的 Wind 数据（聚合所有接口）
 * @param {string} targetDate - 目标日期 YYYY-MM-DD
 * @returns {Promise<Object>} 完整的前端所需数据格式
 */
export async function getWindRealData(targetDate = null) {
  const date = targetDate || new Date().toISOString().split('T')[0];
  console.log(`Fetching Wind data from Server for ${date}...`);
  
  try {
    // 并行获取数据以提高速度
    const [spreadData, marketOverview, sectorData, indicesData] = await Promise.all([
      getEquityBondSpread(date).catch(err => {
        console.error('Error fetching spread data:', err.message);
        // 返回空结构避免整个请求失败
        return { metrics: {}, chartData: [] };
      }),
      getMarketOverview(date).catch(err => {
        console.error('Error fetching market overview:', err.message);
        return {};
      }),
      getSectors(date).catch(err => {
        console.error('Error fetching sectors:', err.message);
        return [];
      }),
      getIndices(date).catch(err => {
        console.error('Error fetching indices:', err.message);
        return [];
      })
    ]);
    
    // 组装最终数据结构
    return {
      equityBondSpread: spreadData,
      overview: {
        date: date,
        windAIndex: spreadData.chartData && spreadData.chartData.length > 0 ? 
                    spreadData.chartData[spreadData.chartData.length - 1].windA : 0,
        // 合并市场概况数据
        ...marketOverview,
        // 合并指数数据
        indices: indicesData
      },
      sectors: sectorData
    };
  } catch (error) {
    console.error('Critical error fetching Wind data:', error);
    throw error;
  }
}
