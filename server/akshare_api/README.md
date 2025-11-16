# AKShare API 使用说明

本项目使用 **AKShare** 作为数据源，这是一个免费开源的金融数据接口库。

## 什么是 AKShare？

AKShare 是基于 Python 的开源金融数据接口库，提供：
- ✅ **完全免费** - 无需购买订阅或付费服务
- ✅ **开源项目** - GitHub 星标 10k+
- ✅ **数据丰富** - 覆盖股票、基金、债券、期货等
- ✅ **易于使用** - 简单的 Python API
- ✅ **实时更新** - 数据源稳定可靠

官方网站: https://akshare.akfamily.xyz/

## 快速开始

### 1. 安装依赖

```bash
# 使用 npm 脚本安装
npm run setup:akshare

# 或手动安装
pip3 install akshare pandas
```

### 2. 验证安装

```bash
# 测试 AKShare 是否正常工作
npm run test:akshare

# 或直接运行 Python 脚本
python3 server/akshare_api/get_market_overview.py 2024-01-15
```

### 3. 启动服务器

```bash
npm run server
```

## API 模块说明

### 1. 指数数据 (`get_indices.py`)

获取主要股指的行情数据：
- 上证指数
- 深证成指
- 创业板指
- 沪深300
- 上证50

**数据来源**: AKShare - `stock_zh_index_daily()`

### 2. 市场概况 (`get_market_overview.py`)

统计全市场股票的涨跌分布：
- 涨停家数
- 上涨家数
- 平盘家数
- 下跌家数
- 跌停家数

**数据来源**: AKShare - `stock_zh_a_spot_em()`

### 3. 板块数据 (`get_sectors.py`)

获取行业板块行情数据：
- 板块涨跌幅
- 板块内涨跌家数
- 领涨个股
- 领跌个股

**数据来源**: 
- `stock_board_industry_name_em()` - 板块列表
- `stock_board_industry_cons_em()` - 板块成分股

### 4. 股债利差 (`get_equity_bond_spread.py`)

计算股债利差及估值分位：
- PE/PB 历史分位
- 股债利差
- 盈利收益率

**数据来源**:
- `stock_zh_index_daily()` - 指数数据
- `index_value_hist_funddb()` - 估值数据
- `bond_zh_us_rate()` - 国债收益率

## 数据更新频率

- **实时数据**: 市场概况、板块数据（交易时段实时更新）
- **日线数据**: 指数数据（每日收盘后更新）
- **月线数据**: 股债利差（每月更新）

## 常见问题

### Q1: 安装失败怎么办？

确保 Python 版本 >= 3.7:
```bash
python3 --version
```

升级 pip:
```bash
pip3 install --upgrade pip
```

### Q2: 获取数据失败？

1. 检查网络连接
2. 确认日期格式正确（YYYY-MM-DD）
3. 非交易日可能无数据，使用最近交易日日期

### Q3: 数据不准确？

AKShare 数据来自公开数据源（东方财富、新浪财经等），可能与专业终端略有差异，但足够准确用于分析展示。

### Q4: 能否用于生产环境？

AKShare 适合：
- ✅ 个人项目
- ✅ 数据分析
- ✅ 学习研究
- ✅ 中小型应用

不适合：
- ❌ 高频交易
- ❌ 对数据延迟要求极高的场景
- ❌ 需要机构级数据质量的场景

## 与 Wind API 对比

| 特性 | AKShare | Wind API |
|------|---------|----------|
| 费用 | 免费 | 付费（数万元/年） |
| 安装 | pip install | 需专用终端 |
| 数据质量 | 公开数据，准确度高 | 机构级数据 |
| 更新频率 | 实时/准实时 | 实时 |
| 使用门槛 | 低 | 高 |
| 适用场景 | 个人/中小项目 | 机构/专业投资 |

## 技术支持

- 官方文档: https://akshare.akfamily.xyz/
- GitHub: https://github.com/akfamily/akshare
- 问题反馈: 提交 Issue 到 AKShare 仓库

## 开发贡献

如需新增数据接口或改进现有功能，欢迎提交 PR！
