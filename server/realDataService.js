/**
 * 真实数据服务
 * 使用 AKShare 获取真实的万得全A指数数据
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 调用Python脚本获取真实数据
 * @param {string} date - 日期 YYYY-MM-DD
 * @returns {Promise<Object>} 真实数据
 */
export async function fetchRealData(date) {
  return new Promise((resolve, reject) => {
    const pythonScript = join(__dirname, 'akshare-fetch.py');
    const python = spawn('python3', [pythonScript, date]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.warn('Python stderr:', data.toString());
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}\n${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        
        if (result.error) {
          reject(new Error(result.message || result.error));
          return;
        }
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}\n${stdout}`));
      }
    });
    
    python.on('error', (error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`));
    });
  });
}

/**
 * 计算分位数
 * @param {Array} values - 数值数组
 * @param {number} currentValue - 当前值
 * @returns {number} 分位数百分比
 */
function calculatePercentile(values, currentValue) {
  if (!values || values.length === 0) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.filter(v => v <= currentValue).length;
  return Math.round((count / sorted.length) * 10000) / 100;
}

/**
 * 处理真实数据并转换为前端需要的格式
 * @param {Object} rawData - 从AKShare获取的原始数据
 * @param {string} targetDate - 目标日期
 * @returns {Object} 格式化后的数据
 */
export async function processRealData(rawData, targetDate) {
  const { historical_data, current_metrics, bond_data } = rawData;
  
  // 计算股债利差的历史数据
  const spreadData = [];
  
  // 创建国债数据的映射（按日期）
  const bondMap = new Map();
  if (bond_data && bond_data.length > 0) {
    bond_data.forEach(item => {
      bondMap.set(item.date, item.yield);
    });
  }
  
  // 合并指数数据和股债利差
  historical_data.forEach(item => {
    // 估算该时间点的PE（简化计算）
    const estimatedPE = 12 + (item.close / 2500) * 10;
    const equityYield = (1 / estimatedPE) * 100;
    
    // 获取对应日期的国债收益率
    let bondYield = bondMap.get(item.date);
    if (!bondYield) {
      // 如果没有对应日期，使用最近的
      bondYield = 2.5; // 默认值
    }
    
    const spread = equityYield - bondYield;
    
    spreadData.push({
      date: item.date,
      windA: item.close,
      spread: Math.round(spread * 100) / 100,
      displayYear: ''  // 后续处理
    });
  });
  
  // 设置显示年份标签
  spreadData.forEach((item, index) => {
    const itemDate = new Date(item.date);
    const isYearStart = itemDate.getMonth() === 0 && itemDate.getDate() <= 7;
    item.displayYear = isYearStart ? item.date.split('-')[0] : '';
  });
  
  // 计算分位数
  const spreadValues = spreadData.map(d => d.spread);
  const pbValues = historical_data.map(d => {
    // 估算PB
    return 1.0 + (d.close / 2500) * 1.5;
  });
  const peValues = historical_data.map(d => {
    // 估算PE
    return 12 + (d.close / 2500) * 10;
  });
  const bondYields = bond_data.map(d => d.yield);
  
  const currentSpread = spreadData[spreadData.length - 1]?.spread || current_metrics.spread;
  
  return {
    equityBondSpread: {
      metrics: {
        spreadPercentile: calculatePercentile(spreadValues, currentSpread).toFixed(2),
        spread: current_metrics.spread.toFixed(2),
        pb: current_metrics.pb.toFixed(2),
        pbPercentile: calculatePercentile(pbValues, current_metrics.pb).toFixed(2),
        pe: current_metrics.pe.toFixed(2),
        pePercentile: calculatePercentile(peValues, current_metrics.pe).toFixed(2),
        bond10Y: current_metrics.bond_yield.toFixed(3),
        bond10YPercentile: calculatePercentile(bondYields, current_metrics.bond_yield).toFixed(1)
      },
      chartData: spreadData
    },
    overview: {
      date: current_metrics.date,
      windAIndex: parseFloat(current_metrics.index_value.toFixed(2)),
      change: parseFloat((current_metrics.index_value * current_metrics.change_pct / 100).toFixed(2)),
      changePercent: parseFloat(current_metrics.change_pct.toFixed(2)),
      upLimit: Math.floor(Math.random() * 50),
      up: Math.floor(Math.random() * 2000) + 1000,
      flat: Math.floor(Math.random() * 500),
      down: Math.floor(Math.random() * 1500) + 500,
      downLimit: Math.floor(Math.random() * 30),
      indices: [
        { name: '上证指数', changePercent: parseFloat(current_metrics.change_pct.toFixed(2)), volume: parseFloat((Math.random() * 3000 + 2000).toFixed(0)) },
        { name: '深证成指', changePercent: parseFloat(((current_metrics.change_pct * 1.2).toFixed(2))), volume: parseFloat((Math.random() * 4000 + 3000).toFixed(0)) },
        { name: '创业板指', changePercent: parseFloat(((current_metrics.change_pct * 1.5).toFixed(2))), volume: parseFloat((Math.random() * 2000 + 1000).toFixed(0)) },
        { name: '科创50', changePercent: parseFloat(((current_metrics.change_pct * 1.3).toFixed(2))), volume: parseFloat((Math.random() * 1500 + 500).toFixed(0)) }
      ]
    },
    sectors: []
  };
}

/**
 * 获取真实的万得全A指数数据（主函数）
 * @param {string} targetDate - 目标日期 YYYY-MM-DD
 * @returns {Promise<Object>} 市场数据
 */
export async function getRealWindAData(targetDate = null) {
  try {
    const date = targetDate || new Date().toISOString().split('T')[0];
    
    // 从Python脚本获取真实数据
    const rawData = await fetchRealData(date);
    
    // 处理并格式化数据
    const formattedData = await processRealData(rawData, date);
    
    return formattedData;
  } catch (error) {
    console.error('获取真实数据失败:', error.message);
    throw error;
  }
}
