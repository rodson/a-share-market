/**
 * 万得全A指数数据服务
 * 模拟从万得获取数据，实际项目中应接入真实的万得API
 */

/**
 * 生成模拟的历史数据
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Array} 历史数据数组
 */
function generateHistoricalData(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data = [];
  
  // 从2005年开始生成数据
  const baseDate = new Date('2005-01-01');
  let currentDate = new Date(baseDate);
  
  // 基础参数
  let windAIndex = 1000; // 万得全A指数初始值
  let spread = 3.5; // 股债利差初始值
  
  while (currentDate <= end) {
    // 模拟指数波动
    const randomWalk = (Math.random() - 0.48) * 50;
    windAIndex = Math.max(500, windAIndex + randomWalk);
    
    // 模拟股债利差波动 (一般在-2到8之间)
    const spreadChange = (Math.random() - 0.5) * 0.5;
    spread = Math.max(-2, Math.min(8, spread + spreadChange));
    
    // 添加一些特殊事件的模拟
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 2008年金融危机
    if (year === 2008 && month >= 6) {
      windAIndex *= 0.98;
      spread += 0.2;
    }
    
    // 2015年股灾
    if (year === 2015 && month >= 5 && month <= 8) {
      windAIndex *= 0.97;
      spread -= 0.3;
    }
    
    // 2020年疫情
    if (year === 2020 && month <= 3) {
      windAIndex *= 0.99;
      spread += 0.15;
    }
    
    // 2021-2023年上涨
    if (year >= 2021 && year <= 2023) {
      windAIndex = Math.min(6500, windAIndex * 1.002);
    }
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      windA: Math.round(windAIndex * 100) / 100,
      spread: Math.round(spread * 100) / 100,
      displayYear: currentDate.getFullYear().toString()
    });
    
    // 每周采样一次
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return data;
}

/**
 * 计算分位数
 * @param {Array} values - 数值数组
 * @param {number} currentValue - 当前值
 * @returns {number} 分位数百分比
 */
function calculatePercentile(values, currentValue) {
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.filter(v => v <= currentValue).length;
  return Math.round((count / sorted.length) * 10000) / 100;
}

/**
 * 获取万得全A指数数据
 * @param {string} targetDate - 目标日期 YYYY-MM-DD
 * @returns {Object} 市场数据
 */
export async function getWindAData(targetDate = null) {
  // 使用今天或指定日期
  const today = targetDate ? new Date(targetDate) : new Date();
  const endDate = today.toISOString().split('T')[0];
  
  // 生成从2005年到目标日期的历史数据
  const historicalData = generateHistoricalData('2005-01-01', endDate);
  
  // 获取最新数据点
  const latestData = historicalData[historicalData.length - 1];
  
  // 计算各项指标的历史分位
  const spreadValues = historicalData.map(d => d.spread);
  const windAValues = historicalData.map(d => d.windA);
  
  // 生成PB、PE和国债收益率的历史数据（基于指数点位动态计算）
  const pbValues = historicalData.map(d => {
    // PB随指数点位变化，基础值1.0，范围0.8-3.5
    return 1.0 + (d.windA / 4000) * 2.5;
  });
  
  const peValues = historicalData.map(d => {
    // PE随指数点位变化，基础值12，范围8-45
    return 12 + (d.windA / 3000) * 25;
  });
  
  const bondValues = historicalData.map((d, index) => {
    // 国债收益率随时间变化，2005年较高，逐渐降低，2020年后更低
    const year = new Date(d.date).getFullYear();
    const baseRate = year < 2008 ? 3.5 : 
                     year < 2015 ? 3.0 : 
                     year < 2020 ? 2.5 : 1.8;
    // 添加一些随机波动
    return baseRate + (Math.random() - 0.5) * 0.5;
  });
  
  // 当前指标值（基于最新指数点位动态计算）
  const currentPB = pbValues[pbValues.length - 1];
  const currentPE = peValues[peValues.length - 1];
  const current10YBond = bondValues[bondValues.length - 1];
  
  // 计算分位数
  const spreadPercentile = calculatePercentile(spreadValues, latestData.spread);
  const pbPercentile = calculatePercentile(pbValues, currentPB);
  const pePercentile = calculatePercentile(peValues, currentPE);
  const bondPercentile = calculatePercentile(bondValues, current10YBond);
  
  // 对图表数据进行采样，每年只显示1月1日的年份标签
  const chartData = historicalData.map((item, index) => {
    const itemDate = new Date(item.date);
    const isYearStart = itemDate.getMonth() === 0 && itemDate.getDate() <= 7;
    
    return {
      ...item,
      displayYear: isYearStart ? item.date.split('-')[0] : ''
    };
  });
  
  return {
    equityBondSpread: {
      metrics: {
        spreadPercentile: spreadPercentile.toFixed(2),
        spread: latestData.spread.toFixed(2),
        pb: currentPB.toFixed(2),
        pbPercentile: pbPercentile.toFixed(2),
        pe: currentPE.toFixed(2),
        pePercentile: pePercentile.toFixed(2),
        bond10Y: current10YBond.toFixed(3),
        bond10YPercentile: bondPercentile.toFixed(1)
      },
      chartData: chartData
    },
    overview: {
      date: endDate,
      windAIndex: parseFloat(latestData.windA.toFixed(2)),
      change: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
      changePercent: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)),
      upLimit: Math.floor(Math.random() * 50),
      up: Math.floor(Math.random() * 2000) + 1000,
      flat: Math.floor(Math.random() * 500),
      down: Math.floor(Math.random() * 1500) + 500,
      downLimit: Math.floor(Math.random() * 30),
      indices: [
        { name: '上证指数', changePercent: parseFloat(((Math.random() - 0.5) * 3).toFixed(2)), volume: parseFloat((Math.random() * 3000 + 2000).toFixed(0)) },
        { name: '深证成指', changePercent: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)), volume: parseFloat((Math.random() * 4000 + 3000).toFixed(0)) },
        { name: '创业板指', changePercent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)), volume: parseFloat((Math.random() * 2000 + 1000).toFixed(0)) },
        { name: '科创50', changePercent: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)), volume: parseFloat((Math.random() * 1500 + 500).toFixed(0)) }
      ]
    },
    sectors: [] // 板块数据可选
  };
}

/**
 * 获取实时数据（如果需要接入真实API）
 * 这里提供接口框架，实际需要万得API key
 */
export async function fetchRealWindData(apiKey, date) {
  // TODO: 实现真实的万得API调用
  // const response = await fetch(`https://api.wind.com.cn/...`, {
  //   headers: { 'Authorization': `Bearer ${apiKey}` }
  // });
  // return response.json();
  
  throw new Error('Real Wind API not implemented. Using mock data instead.');
}
