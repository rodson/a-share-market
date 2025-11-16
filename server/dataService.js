import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取市场数据
 * 数据来源：AKShare - 开源的金融数据接口库
 * 
 * 使用说明：
 * 1. 需要安装Python 3.7+
 * 2. 需要安装AKShare: pip install akshare
 * 3. 需要安装pandas: pip install pandas
 */

/**
 * 调用AKShare Python API获取数据
 * @param {string} script - Python脚本路径
 * @param {Array} args - 参数列表
 * @returns {Promise<Object>} 返回JSON数据
 */
let akshareWarningShown = false;

async function callAKShareAPI(script, args = []) {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const pythonProcess = spawn(pythonCmd, [script, ...args]);
    
    let dataString = '';
    let errorString = '';
    
    // 设置超时时间（5分钟）
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('AKShare API 调用超时（5分钟）'));
    }, 300000); // 5分钟 = 300秒
    
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      clearTimeout(timeout); // 清除超时定时器
      
      if (code !== 0) {
        // 检查是否是 AKShare 模块缺失错误
        if (errorString.includes('No module named \'akshare\'')) {
          if (!akshareWarningShown) {
            console.error('\n❌ AKShare 配置错误');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('原因: AKShare 模块未安装');
            console.error('');
            console.error('请安装 AKShare:');
            console.error('  pip install akshare');
            console.error('  pip install pandas');
            console.error('');
            console.error('AKShare 是免费开源的金融数据接口库');
            console.error('文档: https://akshare.akfamily.xyz/');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            akshareWarningShown = true;
          }
          reject(new Error('AKShare 模块未安装。请运行: pip install akshare pandas'));
        } else {
          console.error('AKShare API 执行错误:', errorString);
          reject(new Error(`AKShare API 调用失败: ${errorString}`));
        }
        return;
      }
      
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (error) {
        console.error('解析 AKShare 数据失败:', error);
        reject(new Error(`数据解析失败: ${error.message}`));
      }
    });
  });
}

// 获取主要指数数据（使用AKShare API）
async function getIndicesData(date) {
  const indices = [
    { code: '000001.SH', name: '上证指数' },
    { code: '399001.SZ', name: '深证成指' },
    { code: '399006.SZ', name: '创业板指' },
    { code: '399005.SZ', name: '中小板指' },
    { code: '000300.SH', name: '沪深300' },
    { code: '000016.SH', name: '上证50' },
  ];

  // 调用AKShare API获取指数数据 - 失败直接抛出异常
  const scriptPath = path.join(__dirname, 'akshare_api', 'get_indices.py');
  const codes = indices.map(i => i.code).join(',');
  const result = await callAKShareAPI(scriptPath, [codes, date]);
  
  // 格式化返回数据
  return result.map((item, index) => ({
    name: indices[index].name,
    changePercent: item.pct_chg || 0,
    volume: item.volume ? (item.volume / 100000000).toFixed(2) : '0'
  }));
}

// 获取板块数据（使用AKShare API）
async function getSectorsData(date) {
  // 调用AKShare API获取板块数据 - 失败直接抛出异常
  const scriptPath = path.join(__dirname, 'akshare_api', 'get_sectors.py');
  const result = await callAKShareAPI(scriptPath, [date]);
  
  return result;
}

// 获取市场概况数据
async function getMarketOverview(date) {
  // 调用AKShare API获取市场概况 - 使用V3超快版本
  const scriptPath = path.join(__dirname, 'akshare_api', 'get_market_overview_v3.py');
  const result = await callAKShareAPI(scriptPath, [date]);
  
  return {
    ...result,
    indices: await getIndicesData(date)
  };
}

// 获取股债利差数据（使用AKShare API）
async function getEquityBondSpreadData(date) {
  // 调用AKShare API获取股债利差历史数据 - 失败直接抛出异常
  const scriptPath = path.join(__dirname, 'akshare_api', 'get_equity_bond_spread.py');
  const result = await callAKShareAPI(scriptPath, [date]);
  
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
