# Wind API 数据服务配置指南

## 简介

本项目已升级为使用万得（Wind）金融终端API获取A股市场数据。Wind是中国领先的金融数据服务商，提供高质量的金融市场数据。

## 环境要求

### 1. Wind金融终端
- 需要安装Wind金融终端客户端
- 需要有效的Wind账号和订阅服务
- 使用前确保Wind终端已登录

### 2. Python环境
- Python 3.6+
- WindPy库（Wind官方Python SDK）

## 安装步骤

### 1. 安装Wind金融终端

1. 访问Wind官网下载终端：https://www.wind.com.cn/
2. 安装并登录Wind终端
3. 确保终端保持运行状态

### 2. 安装WindPy

```bash
# 使用pip安装WindPy
pip install WindPy

# 或者从Wind客户端安装目录获取
# Windows系统通常在: C:\Wind\Wind.NET.Client\WindNET\bin
# 将WindPy.pyd和相关文件复制到Python的site-packages目录
```

### 3. 验证安装

创建测试文件 `test_wind.py`:

```python
from WindPy import w

# 启动Wind API
w.start()

# 检查连接状态
if w.isconnected():
    print("Wind API连接成功!")
    
    # 测试获取数据
    data = w.wsd("000001.SH", "close", "2024-01-01", "2024-01-05", "")
    print(data)
    
    w.stop()
else:
    print("Wind API连接失败，请检查Wind终端是否已登录")
```

运行测试：
```bash
python test_wind.py
```

## 数据接口说明

### 1. get_indices.py - 获取指数数据

获取指定日期的指数行情数据。

**参数:**
- `codes`: 指数代码列表，逗号分隔（如: "000001.SH,399001.SZ"）
- `date`: 日期，格式: YYYY-MM-DD

**返回数据:**
```json
[
  {
    "code": "000001.SH",
    "pct_chg": 0.52,
    "volume": 32560000,
    "amt": 250000
  }
]
```

### 2. get_sectors.py - 获取板块数据

获取指定日期的板块行情数据，包括涨跌幅、领涨领跌股等。

**参数:**
- `date`: 日期，格式: YYYY-MM-DD

**返回数据:**
```json
[
  {
    "category": "指数",
    "name": "沪深300",
    "changePercent": 0.48,
    "topGainer": {"name": "招商银行", "changePercent": 1.92},
    "topLoser": {"name": "五粮液", "changePercent": -0.68},
    "upCount": 189,
    "downCount": 111
  }
]
```

### 3. get_market_overview.py - 获取市场概况

获取指定日期的市场整体情况，包括涨跌停、上涨下跌家数等。

**参数:**
- `date`: 日期，格式: YYYY-MM-DD

**返回数据:**
```json
{
  "upLimit": 32,
  "up": 1923,
  "flat": 156,
  "down": 1342,
  "downLimit": 18,
  "changePercent": 58.9
}
```

### 4. get_equity_bond_spread.py - 获取股债利差数据

获取历史股债利差数据及估值分位。

**参数:**
- `date`: 目标日期，格式: YYYY-MM-DD

**返回数据:**
```json
{
  "metrics": {
    "spreadPercentile": 45.23,
    "spread": "2.15",
    "pb": 1.52,
    "pbPercentile": 38.67,
    "pe": 14.8,
    "pePercentile": 42.15
  },
  "chartData": [
    {
      "date": "2005-01-01",
      "year": 2005,
      "displayYear": 2005,
      "spread": 2.5,
      "windA": 2800
    }
  ]
}
```

## Wind API常用指标说明

### 指数数据字段
- `close`: 收盘价
- `pct_chg`: 涨跌幅(%)
- `volume`: 成交量(手)
- `amt`: 成交额(万元)
- `pe_ttm`: 市盈率TTM
- `pb_lf`: 市净率

### 常用指数代码
- `000001.SH`: 上证指数
- `399001.SZ`: 深证成指
- `399006.SZ`: 创业板指
- `000300.SH`: 沪深300
- `000016.SH`: 上证50
- `000905.SH`: 中证500
- `000688.SH`: 科创50
- `881001.WI`: 万得全A

### 常用板块代码
- `881001.WI ~ 881023.WI`: Wind行业分类板块
- 具体板块代码可在Wind终端中查询

## 故障排除

### 1. "Wind API连接失败"错误

**可能原因:**
- Wind终端未登录
- Wind终端未运行
- WindPy未正确安装

**解决方法:**
1. 确保Wind终端已启动并登录
2. 检查WindPy是否正确安装: `pip show WindPy`
3. 尝试重启Wind终端

### 2. "获取数据失败"错误

**可能原因:**
- 日期超出数据范围
- 代码错误
- 没有相应数据权限

**解决方法:**
1. 检查日期格式是否正确
2. 验证Wind代码是否正确
3. 确认您的Wind账号有相应数据权限

### 3. Python模块导入错误

**错误信息:** `ModuleNotFoundError: No module named 'WindPy'`

**解决方法:**
```bash
# 方法1: 使用pip安装
pip install WindPy

# 方法2: 手动安装
# 从Wind安装目录复制WindPy相关文件到Python的site-packages目录
```

## 降级方案

如果Wind API暂时不可用，系统会自动降级使用模拟数据，确保前端正常显示。模拟数据在 `dataService.js` 中的各个函数的 `catch` 块中定义。

## 性能优化建议

1. **缓存数据**: 对于历史数据，建议添加缓存机制，减少API调用
2. **批量查询**: 尽量使用批量查询接口，减少API调用次数
3. **异步处理**: 使用异步方式处理多个数据请求

## 联系支持

- Wind技术支持: 400-820-9463
- Wind官网: https://www.wind.com.cn/
- WindPy文档: 在Wind终端中查看帮助文档

## 许可说明

使用Wind数据需要遵守Wind的服务协议和数据使用规范。确保您有合法的数据使用权限。
