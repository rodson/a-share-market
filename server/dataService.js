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
let windPyWarningShown = false;

async function callWindAPI(script, args = []) {
  return new Promise((resolve, reject) => {
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
        // 检查是否是 WindPy 模块缺失错误
        if (errorString.includes('No module named \'WindPy\'')) {
          if (!windPyWarningShown) {
            console.error('\n❌ Wind API 配置错误');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('原因: WindPy 模块未安装');
            console.error('');
            console.error('WindPy 是 Wind 金融终端的专属 SDK，需要：');
            console.error('  1. 购买 Wind 服务订阅');
            console.error('  2. 安装 Wind 金融终端');
            console.error('  3. 从 Wind 终端安装目录获取 WindPy');
            console.error('');
            console.error('详细配置指南: WIND_API_SETUP.md');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            windPyWarningShown = true;
          }
          reject(new Error('WindPy 模块未安装。请安装 Wind 金融终端和 WindPy，或查看 WIND_API_SETUP.md 了解详情。'));
        } else {
          console.error('Wind API 执行错误:', errorString);
          reject(new Error(`Wind API 调用失败: ${errorString}`));
        }
        return;
      }
      
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (error) {
        console.error('解析 Wind 数据失败:', error);
        reject(new Error(`数据解析失败: ${error.message}`));
      }
    });
    
    // 设置超时时间（10秒）
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Wind API 调用超时（10秒）'));
    }, 10000);
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

  // 调用Wind API获取指数数据 - 失败直接抛出异常
  const scriptPath = path.join(__dirname, 'wind_api', 'get_indices.py');
  const codes = indices.map(i => i.code).join(',');
  const result = await callWindAPI(scriptPath, [codes, date]);
  
  // 格式化返回数据
  return result.map((item, index) => ({
    name: indices[index].name,
    changePercent: item.pct_chg || 0,
    volume: item.volume ? (item.volume / 100000000).toFixed(2) : '0'
  }));
}

// 获取板块数据（使用Wind API）
async function getSectorsData(date) {
  // 调用Wind API获取板块数据 - 失败直接抛出异常
  const scriptPath = path.join(__dirname, 'wind_api', 'get_sectors.py');
  const result = await callWindAPI(scriptPath, [date]);
  
  return result;
}

// 获取市场概况数据
async function getMarketOverview(date) {
  // 调用Wind API获取市场概况 - 失败直接抛出异常
  const scriptPath = path.join(__dirname, 'wind_api', 'get_market_overview.py');
  const result = await callWindAPI(scriptPath, [date]);
  
  return {
    ...result,
    indices: await getIndicesData(date)
  };
}

// 获取股债利差数据（使用Wind API）
async function getEquityBondSpreadData(date) {
  // 调用Wind API获取股债利差历史数据 - 失败直接抛出异常
  const scriptPath = path.join(__dirname, 'wind_api', 'get_equity_bond_spread.py');
  const result = await callWindAPI(scriptPath, [date]);
  
  return result;
}

// 主函数：获取完整市场数据
export async function getMarketData(date) {
  // 并行获取所有数据 - 任何一个失败都会导致整体失败
  const [overview, sectors, equityBondSpreadData] = await Promise.all([
    getMarketOverview(date),
    getSectorsData(date),
    getEquityBondSpreadData(date)
  ]);

  // 处理股债利差数据
  const chartData = equityBondSpreadData.chartData || equityBondSpreadData;
  const metrics = equityBondSpreadData.metrics;
  
  if (!metrics) {
    throw new Error('股债利差数据缺少 metrics 字段');
  }
  
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
}
