# Wind API 快速参考

## 🚀 快速开始

```bash
# 1. 安装WindPy
pip install WindPy

# 2. 测试连接
npm run test:wind

# 3. 启动服务
npm run server
```

## 📝 基本用法

### Python中使用Wind API

```python
from WindPy import w

# 启动
w.start()

# 检查连接
if w.isconnected():
    # 获取数据
    data = w.wsd("000001.SH", "close", "2024-01-01", "2024-01-05", "")
    print(data)

# 关闭
w.stop()
```

### Node.js中调用Wind API

```javascript
import { spawn } from 'child_process';

async function callWindAPI(script, args) {
  const pythonProcess = spawn('python', [script, ...args]);
  
  let dataString = '';
  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });
  
  return new Promise((resolve, reject) => {
    pythonProcess.on('close', (code) => {
      if (code !== 0) reject(new Error('调用失败'));
      resolve(JSON.parse(dataString));
    });
  });
}
```

## 🔑 常用Wind代码

### 指数代码

| 代码 | 名称 |
|------|------|
| 000001.SH | 上证指数 |
| 399001.SZ | 深证成指 |
| 399006.SZ | 创业板指 |
| 000300.SH | 沪深300 |
| 000016.SH | 上证50 |
| 000905.SH | 中证500 |
| 000688.SH | 科创50 |
| 881001.WI | 万得全A |

### 行业代码

| 代码 | 名称 |
|------|------|
| 881001.WI | 银行 |
| 881002.WI | 证券 |
| 881003.WI | 保险 |
| 881004.WI | 工业 |
| 881005.WI | 工程机械 |

### 债券代码

| 代码 | 名称 |
|------|------|
| M0041716 | 10年期国债收益率 |
| M0041717 | 5年期国债收益率 |
| M0041718 | 3年期国债收益率 |

## 📊 常用函数

### w.wsd() - 时间序列数据

获取单个或多个证券的日线数据（时间序列）

```python
# 单个证券
data = w.wsd("000001.SH", "close,pct_chg", "2024-01-01", "2024-01-05", "")

# 多个证券
data = w.wsd("000001.SH,399001.SZ", "close", "2024-01-01", "2024-01-05", "")
```

**常用字段:**
- `close` - 收盘价
- `open` - 开盘价
- `high` - 最高价
- `low` - 最低价
- `pct_chg` - 涨跌幅(%)
- `volume` - 成交量(手)
- `amt` - 成交额(万元)
- `pe_ttm` - 市盈率TTM
- `pb_lf` - 市净率

### w.wss() - 截面数据

获取多个证券某一时点的数据（截面）

```python
# 获取多个证券的当前数据
data = w.wss("000001.SH,399001.SZ,399006.SZ", 
             "close,pct_chg", 
             "tradeDate=2024-01-02")
```

### w.wset() - 板块数据

获取板块成分股、板块分类等数据

```python
# 获取板块成分股
data = w.wset("sectorconstituent", 
              "date=2024-01-02;windcode=000300.SH")

# 获取全部A股
data = w.wset("sectorconstituent", 
              "date=2024-01-02;windcode=a001010100000000")
```

## 🎯 数据字段

### 行情字段

| 字段 | 说明 | 单位 |
|-----|------|------|
| close | 收盘价 | 元 |
| open | 开盘价 | 元 |
| high | 最高价 | 元 |
| low | 最低价 | 元 |
| pct_chg | 涨跌幅 | % |
| volume | 成交量 | 手 |
| amt | 成交额 | 万元 |
| turn | 换手率 | % |

### 估值字段

| 字段 | 说明 |
|-----|------|
| pe_ttm | 市盈率TTM |
| pb_lf | 市净率 |
| ps_ttm | 市销率TTM |
| pcf_ocf_ttm | 市现率TTM |
| ev | 企业价值 |
| ev2_to_ebitda | EV/EBITDA |

### 财务字段

| 字段 | 说明 |
|-----|------|
| mkt_cap_ard | 总市值 |
| ev | 企业价值 |
| roe_ttm2 | ROE(TTM) |
| roa_ttm2 | ROA(TTM) |
| net_profit_parent_comp_ttm | 净利润TTM |

## 🔧 项目使用

### 获取指数数据

```bash
python server/wind_api/get_indices.py "000001.SH,399001.SZ" "2024-01-02"
```

### 获取板块数据

```bash
python server/wind_api/get_sectors.py "2024-01-02"
```

### 获取市场概况

```bash
python server/wind_api/get_market_overview.py "2024-01-02"
```

### 获取股债利差

```bash
python server/wind_api/get_equity_bond_spread.py "2024-01-02"
```

## 💡 最佳实践

### 1. 错误处理

```python
data = w.wsd("000001.SH", "close", "2024-01-01", "2024-01-05", "")

if data.ErrorCode != 0:
    print(f"错误: {data.ErrorMsg}")
else:
    print(f"数据: {data.Data}")
```

### 2. 数据提取

```python
# 提取数据
dates = data.Times
closes = data.Data[0]  # 第一个字段
volumes = data.Data[1]  # 第二个字段

# 组合数据
for i in range(len(dates)):
    print(f"{dates[i]}: {closes[i]}")
```

### 3. 批量查询

```python
# 使用列表批量查询
codes = ["000001.SH", "399001.SZ", "399006.SZ"]
codes_str = ",".join(codes)

data = w.wss(codes_str, "close,pct_chg", "tradeDate=2024-01-02")
```

### 4. JSON输出

```python
import json

result = {
    "date": "2024-01-02",
    "data": [
        {
            "code": code,
            "close": data.Data[0][i],
            "pct_chg": data.Data[1][i]
        }
        for i, code in enumerate(data.Codes)
    ]
}

print(json.dumps(result, ensure_ascii=False))
```

## 🐛 常见错误

### ErrorCode 含义

| Code | 说明 | 解决方法 |
|------|------|----------|
| 0 | 成功 | - |
| -40520007 | 没有可用数据 | 检查日期、代码是否正确 |
| -40521009 | 数据解码失败 | 检查字段名称 |
| -40522009 | 登录失败 | 检查Wind终端是否登录 |

### 连接问题

```python
# 检查连接
if not w.isconnected():
    print("Wind未连接，请检查:")
    print("1. Wind终端是否运行")
    print("2. Wind终端是否已登录")
    print("3. WindPy是否正确安装")
```

## 📚 参考资源

### Wind官方

- **官网**: https://www.wind.com.cn/
- **客服**: 400-820-9463
- **文档**: Wind终端 → 帮助 → API文档

### 项目文档

- [Wind集成指南](../../WIND_SETUP_GUIDE.md)
- [API详细文档](./README.md)
- [使用示例](./example_usage.py)

## 🎓 学习路径

1. **入门** (30分钟)
   - 阅读快速开始
   - 运行测试脚本
   - 查看示例代码

2. **进阶** (2小时)
   - 学习常用函数
   - 了解数据字段
   - 编写简单脚本

3. **精通** (持续学习)
   - 阅读Wind官方文档
   - 实践复杂查询
   - 优化性能

## 💻 实用代码片段

### 获取最新交易日

```python
# 获取最近的交易日
trade_days = w.tdays("2024-01-01", "2024-01-31", "")
latest_day = trade_days.Times[-1]
```

### 判断是否交易日

```python
# 检查某日是否为交易日
result = w.tdaysoffset(0, "2024-01-02", "")
is_trade_day = (result.Data[0][0] == datetime(2024, 1, 2).date())
```

### 获取前N个交易日

```python
# 获取当前日期的前10个交易日
result = w.tdaysoffset(-10, "2024-01-15", "")
prev_10_days = result.Data[0][0]
```

---

**提示**: 更多详细信息请查看 [完整文档](./README.md) 或运行 `python example_usage.py`
