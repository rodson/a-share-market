import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取市场数据
 * 数据来源：Wind万得金融终端API
 * 
 * 使用说明：
 * 1. 需要安装Wind金融终端客户端
 * 2. 需要安装WindPy: pip install WindPy
 * 3. 确保Wind终端已登录
 */

/**
 * 调用Wind Python API获取数据
 * @param {string} script - Python脚本路径
 * @param {Array} args - 参数列表
 * @returns {Promise<Object>} 返回JSON数据
 */
async function callWindAPI(script, args = []) {
  return new Promise((resolve, reject) => {
    // 尝试使用 python3，如果不存在则使用 python
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const pythonProcess = spawn(pythonCmd, [script, ...args]);
    
    let dataString = '';
    let errorString = '';
    
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Wind API Error:', errorString);
        reject(new Error(`Wind API调用失败: ${errorString}`));
        return;
      }
      
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (error) {
        console.error('解析Wind数据失败:', error);
        reject(error);
      }
    });
  });
}

// 获取主要指数数据（使用Wind API）
async function getIndicesData(date) {
  const indices = [
    { code: '000001.SH', name: '上证指数' },
    { code: '399001.SZ', name: '深证成指' },
    { code: '399006.SZ', name: '创业板指' },
    { code: '399005.SZ', name: '中小板指' },
    { code: '000300.SH', name: '沪深300' },
    { code: '000016.SH', name: '上证50' },
  ];

  try {
    // 调用Wind API获取指数数据
    const scriptPath = path.join(__dirname, 'wind_api', 'get_indices.py');
    const codes = indices.map(i => i.code).join(',');
    const result = await callWindAPI(scriptPath, [codes, date]);
    
    // 格式化返回数据
    return result.map((item, index) => ({
      name: indices[index].name,
      changePercent: item.pct_chg || 0,
      volume: item.volume ? (item.volume / 100000000).toFixed(2) : '0'
    }));
  } catch (error) {
    console.error('Error fetching indices data from Wind:', error);
    // 返回模拟数据
    return [
      { name: '上证指数', changePercent: 0.52, volume: '325.6' },
      { name: '深证成指', changePercent: 0.83, volume: '412.3' },
      { name: '创业板指', changePercent: 1.25, volume: '189.7' },
      { name: '中小板指', changePercent: 0.67, volume: '156.2' },
      { name: '沪深300', changePercent: 0.48, volume: '287.9' },
      { name: '上证50', changePercent: 0.35, volume: '198.4' },
    ];
  }
}

// 获取板块数据（使用Wind API）
async function getSectorsData(date) {
  try {
    // 调用Wind API获取板块数据
    const scriptPath = path.join(__dirname, 'wind_api', 'get_sectors.py');
    const result = await callWindAPI(scriptPath, [date]);
    
    return result;
  } catch (error) {
    console.error('Error fetching sectors data from Wind:', error);
    // 返回模拟数据
    return generateCompleteSectorData();
  }
}

// 生成完整的板块数据（模拟数据，当Wind API不可用时使用）
function generateCompleteSectorData() {
  const sectors = [];

  // 1. 概念板块
  const conceptSectors = [
    { name: '上证50', changePercent: 0.35, topGainer: { name: '中国平安', changePercent: 1.85 }, topLoser: { name: '贵州茅台', changePercent: -0.52 }, upCount: 31, downCount: 19 },
    { name: '沪深300', changePercent: 0.48, topGainer: { name: '招商银行', changePercent: 1.92 }, topLoser: { name: '五粮液', changePercent: -0.68 }, upCount: 189, downCount: 111 },
    { name: '中证500', changePercent: 0.73, topGainer: { name: '宁德时代', changePercent: 2.45 }, topLoser: { name: '比亚迪', changePercent: -1.23 }, upCount: 312, downCount: 188 },
    { name: '创业板50', changePercent: 1.25, topGainer: { name: '迈瑞医疗', changePercent: 2.87 }, topLoser: { name: '东方财富', changePercent: -0.95 }, upCount: 28, downCount: 22 },
    { name: '科创50', changePercent: 1.56, topGainer: { name: '中芯国际', changePercent: 3.12 }, topLoser: { name: '澜起科技', changePercent: -1.08 }, upCount: 31, downCount: 19 },
  ];

  // 2. 银行板块
  const bankSectors = [
    { name: '银行', changePercent: 0.65, topGainer: { name: '招商银行', changePercent: 1.92 }, topLoser: { name: '兴业银行', changePercent: -0.45 }, upCount: 28, downCount: 14 },
    { name: '证券', changePercent: 1.23, topGainer: { name: '中信证券', changePercent: 2.15 }, topLoser: { name: '华泰证券', changePercent: -0.78 }, upCount: 31, downCount: 10 },
    { name: '保险', changePercent: 0.87, topGainer: { name: '中国平安', changePercent: 1.85 }, topLoser: { name: '中国人寿', changePercent: -0.52 }, upCount: 5, downCount: 2 },
  ];

  // 3. 工业
  const industrySectors = [
    { name: '工业', changePercent: 0.92, topGainer: { name: '三一重工', changePercent: 2.34 }, topLoser: { name: '中国中车', changePercent: -0.87 }, upCount: 412, downCount: 253 },
    { name: '工程机械', changePercent: 1.15, topGainer: { name: '徐工机械', changePercent: 2.67 }, topLoser: { name: '柳工', changePercent: -0.95 }, upCount: 18, downCount: 9 },
  ];

  // 4. 原材料
  const materialSectors = [
    { name: '原材料', changePercent: 0.78, topGainer: { name: '紫金矿业', changePercent: 2.12 }, topLoser: { name: '洛阳钼业', changePercent: -1.05 }, upCount: 289, downCount: 178 },
    { name: '钢铁', changePercent: 0.45, topGainer: { name: '宝钢股份', changePercent: 1.56 }, topLoser: { name: '河钢股份', changePercent: -0.67 }, upCount: 28, downCount: 16 },
    { name: '有色金属', changePercent: 1.12, topGainer: { name: '紫金矿业', changePercent: 2.12 }, topLoser: { name: '中国铝业', changePercent: -0.89 }, upCount: 112, downCount: 67 },
  ];

  // 5. 消费
  const consumerSectors = [
    { name: '可选消费', changePercent: 0.95, topGainer: { name: '比亚迪', changePercent: 2.34 }, topLoser: { name: '长城汽车', changePercent: -1.12 }, upCount: 277, downCount: 171 },
    { name: '汽车', changePercent: 1.23, topGainer: { name: '比亚迪', changePercent: 2.34 }, topLoser: { name: '上汽集团', changePercent: -0.98 }, upCount: 89, downCount: 55 },
    { name: '新能源汽车', changePercent: 1.56, topGainer: { name: '比亚迪', changePercent: 2.34 }, topLoser: { name: '小鹏汽车', changePercent: -1.45 }, upCount: 78, downCount: 48 },
    { name: '日常消费', changePercent: 0.67, topGainer: { name: '贵州茅台', changePercent: 1.23 }, topLoser: { name: '五粮液', changePercent: -0.68 }, upCount: 89, downCount: 55 },
    { name: '白酒', changePercent: 0.85, topGainer: { name: '贵州茅台', changePercent: 1.23 }, topLoser: { name: '泸州老窖', changePercent: -0.45 }, upCount: 18, downCount: 11 },
  ];

  // 6. 医疗保健
  const healthcareSectors = [
    { name: '医疗保健', changePercent: 1.12, topGainer: { name: '迈瑞医疗', changePercent: 2.87 }, topLoser: { name: '恒瑞医药', changePercent: -0.95 }, upCount: 234, downCount: 144 },
    { name: '医疗器械', changePercent: 1.45, topGainer: { name: '迈瑞医疗', changePercent: 2.87 }, topLoser: { name: '鱼跃医疗', changePercent: -0.78 }, upCount: 67, downCount: 41 },
    { name: '医药', changePercent: 0.98, topGainer: { name: '恒瑞医药', changePercent: 1.95 }, topLoser: { name: '云南白药', changePercent: -0.87 }, upCount: 178, downCount: 109 },
  ];

  // 7. 信息技术
  const techSectors = [
    { name: '信息技术', changePercent: 1.34, topGainer: { name: '中兴通讯', changePercent: 2.98 }, topLoser: { name: '海康威视', changePercent: -1.12 }, upCount: 389, downCount: 239 },
    { name: '半导体', changePercent: 1.67, topGainer: { name: '中芯国际', changePercent: 3.12 }, topLoser: { name: '韦尔股份', changePercent: -1.34 }, upCount: 112, downCount: 69 },
    { name: '芯片', changePercent: 1.78, topGainer: { name: '兆易创新', changePercent: 3.45 }, topLoser: { name: '卓胜微', changePercent: -1.23 }, upCount: 89, downCount: 55 },
    { name: '消费电子', changePercent: 1.12, topGainer: { name: '立讯精密', changePercent: 2.34 }, topLoser: { name: '歌尔股份', changePercent: -0.98 }, upCount: 67, downCount: 41 },
  ];

  // 8. 新能源
  const newEnergySectors = [
    { name: '新能源', changePercent: 1.45, topGainer: { name: '隆基绿能', changePercent: 2.87 }, topLoser: { name: '阳光电源', changePercent: -1.12 }, upCount: 123, downCount: 76 },
    { name: '光伏', changePercent: 1.56, topGainer: { name: '隆基绿能', changePercent: 2.87 }, topLoser: { name: '通威股份', changePercent: -1.05 }, upCount: 89, downCount: 55 },
    { name: '锂电池', changePercent: 1.34, topGainer: { name: '宁德时代', changePercent: 2.45 }, topLoser: { name: '亿纬锂能', changePercent: -0.98 }, upCount: 56, downCount: 34 },
  ];

  // 合并所有板块
  sectors.push(...conceptSectors.map(s => ({ ...s, category: '指数' })));
  sectors.push(...bankSectors.map(s => ({ ...s, category: '金融' })));
  sectors.push(...industrySectors.map(s => ({ ...s, category: '工业' })));
  sectors.push(...materialSectors.map(s => ({ ...s, category: '原材料' })));
  sectors.push(...consumerSectors.map(s => ({ ...s, category: '消费' })));
  sectors.push(...healthcareSectors.map(s => ({ ...s, category: '医疗保健' })));
  sectors.push(...techSectors.map(s => ({ ...s, category: '信息技术' })));
  sectors.push(...newEnergySectors.map(s => ({ ...s, category: '新能源' })));

  return sectors;
}

// 获取市场概况数据
async function getMarketOverview(date) {
  try {
    // 调用Wind API获取市场概况
    const scriptPath = path.join(__dirname, 'wind_api', 'get_market_overview.py');
    const result = await callWindAPI(scriptPath, [date]);
    
    return {
      ...result,
      indices: await getIndicesData(date)
    };
  } catch (error) {
    console.error('Error fetching market overview from Wind:', error);
    return {
      upLimit: 32,
      up: 1923,
      flat: 156,
      down: 1342,
      downLimit: 18,
      changePercent: 0.52,
      indices: await getIndicesData(date)
    };
  }
}

// 获取股债利差数据（使用Wind API）
async function getEquityBondSpreadData(date) {
  try {
    // 调用Wind API获取股债利差历史数据
    const scriptPath = path.join(__dirname, 'wind_api', 'get_equity_bond_spread.py');
    const result = await callWindAPI(scriptPath, [date]);
    
    return result;
  } catch (error) {
    console.error('Error fetching equity bond spread from Wind:', error);
    return generateEquityBondSpreadData();
  }
}

// 生成股债利差历史数据（模拟数据，当Wind API不可用时使用）
// 使用盈利收益率法：股债利差 = 盈利收益率 - 国债收益率
// 盈利收益率 = (1 / PE) × 100
function generateEquityBondSpreadData() {
  const data = [];
  const startDate = new Date('2005-01-01');
  const endDate = new Date('2025-10-31');
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    
    // 模拟PE和国债收益率
    const basePE = 15 + Math.sin(year / 5) * 8;  // PE基准值15，波动范围7-23
    const pe = basePE + Math.random() * 5;  // 加入随机波动
    const bondYield = 2.8 + Math.sin(year / 8) * 0.8 + Math.random() * 0.3;  // 国债收益率2-4%
    
    // 盈利收益率法计算股债利差
    const earningsYield = (1 / pe) * 100;  // 盈利收益率 = E/P
    const spread = earningsYield - bondYield;  // 股债利差
    
    // 模拟万得全A指数（基于PE估算）
    let windA = 3000 + Math.sin(year / 3) * 1500 + Math.random() * 500;
    
    data.push({
      date: dateStr,
      year: year,
      displayYear: month === 1 ? year : '',
      spread: parseFloat(spread.toFixed(2)),
      windA: parseFloat(windA.toFixed(0))
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return data;
}

// 获取股债利差指标数据
function getEquityBondSpreadMetrics(date, chartData) {
  const targetDate = new Date(date);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1;
  
  const targetDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const dataPoint = chartData.find(d => d.date === targetDateStr);
  
  if (!dataPoint) {
    const closestData = chartData[chartData.length - 1];
    return calculateMetrics(closestData, chartData);
  }
  
  return calculateMetrics(dataPoint, chartData);
}

// 计算估值指标（基于盈利收益率法）
function calculateMetrics(dataPoint, allData) {
  const spread = dataPoint.spread;
  const windA = dataPoint.windA;
  
  // 计算股债利差分位
  const spreadValues = allData.map(d => d.spread).sort((a, b) => a - b);
  const spreadRank = spreadValues.filter(v => v <= spread).length;
  const spreadPercentile = ((spreadRank / spreadValues.length) * 100).toFixed(2);
  
  // 估算PB和PE
  const pb = (1.5 * windA / 3000).toFixed(2);
  const pe = (15 * windA / 3000).toFixed(2);
  
  // 计算PB和PE的历史分位
  const pbValues = allData.map(d => (1.5 * d.windA / 3000)).sort((a, b) => a - b);
  const peValues = allData.map(d => (15 * d.windA / 3000)).sort((a, b) => a - b);
  
  const pbRank = pbValues.filter(v => v <= parseFloat(pb)).length;
  const peRank = peValues.filter(v => v <= parseFloat(pe)).length;
  
  const pbPercentile = ((pbRank / pbValues.length) * 100).toFixed(2);
  const pePercentile = ((peRank / peValues.length) * 100).toFixed(2);
  
  return {
    spreadPercentile: parseFloat(spreadPercentile),
    spread: spread.toFixed(2),
    pb: parseFloat(pb),
    pbPercentile: parseFloat(pbPercentile),
    pe: parseFloat(pe),
    pePercentile: parseFloat(pePercentile)
  };
}

// 主函数：获取完整市场数据
export async function getMarketData(date) {
  try {
    const [overview, sectors, equityBondSpreadData] = await Promise.all([
      getMarketOverview(date),
      getSectorsData(date),
      getEquityBondSpreadData(date)
    ]);

    // 处理股债利差数据
    const chartData = equityBondSpreadData.chartData || equityBondSpreadData;
    const metrics = equityBondSpreadData.metrics || getEquityBondSpreadMetrics(date, chartData);
    
    const equityBondSpread = {
      metrics,
      chartData
    };

    return {
      date,
      overview,
      sectors,
      equityBondSpread
    };
  } catch (error) {
    console.error('Error in getMarketData:', error);
    throw error;
  }
}
