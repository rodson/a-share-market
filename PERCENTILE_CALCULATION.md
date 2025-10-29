# 股债利差估值分位计算方法详解

## 什么是分位值（Percentile）

分位值表示某个数值在一组数据中的相对位置，用百分比表示。

**例如：**
- 分位值 = 50%：表示有50%的历史数据低于当前值（中位数）
- 分位值 = 80%：表示有80%的历史数据低于当前值（较高位置）
- 分位值 = 20%：表示有20%的历史数据低于当前值（较低位置）

## 股债利差估值分位计算步骤

### 第1步：获取历史数据

```javascript
// 收集2005年1月至2025年10月的所有股债利差数据
const allData = [
  { date: '2005-01-01', spread: 2.5 },
  { date: '2005-02-01', spread: 2.3 },
  { date: '2005-03-01', spread: 2.8 },
  // ... 约250个数据点
  { date: '2025-10-01', spread: 3.79 }
];
```

### 第2步：提取所有股债利差值并排序

```javascript
// 提取所有股债利差值
const spreadValues = allData.map(d => d.spread);
// 结果：[2.5, 2.3, 2.8, ..., 3.79]

// 从小到大排序
spreadValues.sort((a, b) => a - b);
// 结果：[-1.2, -0.8, 0.5, 1.2, 1.5, ..., 5.5, 6.2]
```

### 第3步：计算当前值的排名

```javascript
// 假设当前日期的股债利差为 3.79%
const currentSpread = 3.79;

// 统计有多少个历史值 <= 当前值
const spreadRank = spreadValues.filter(v => v <= currentSpread).length;

// 例如：如果有82个值 <= 3.79，总共250个数据点
// spreadRank = 82
```

### 第4步：计算分位值

```javascript
// 分位值 = (排名 / 总数) × 100%
const spreadPercentile = (spreadRank / spreadValues.length) * 100;

// 例如：(82 / 250) × 100 = 32.8%
```

## 完整代码实现

```javascript
// 计算股债利差分位
function calculateSpreadPercentile(currentSpread, allData) {
  // 1. 提取所有历史股债利差值
  const spreadValues = allData.map(d => d.spread);
  
  // 2. 从小到大排序
  spreadValues.sort((a, b) => a - b);
  
  // 3. 计算当前值的排名（有多少个值 <= 当前值）
  const spreadRank = spreadValues.filter(v => v <= currentSpread).length;
  
  // 4. 计算分位值
  const spreadPercentile = (spreadRank / spreadValues.length) * 100;
  
  return spreadPercentile.toFixed(2); // 保留2位小数
}
```

## 实际案例分析

### 案例1：2008年金融危机（股债利差 = 5.5%）

```
历史数据：250个数据点
排序后：[-1.2, -0.8, ..., 3.5, 3.8, 4.2, 4.5, 5.0, 5.5, 5.8, 6.2]
                                                    ↑
                                                 当前值

有多少个值 <= 5.5：约212个
分位值 = (212 / 250) × 100 = 84.8%

解读：当前股债利差处于历史84.8%的位置
     说明股债利差很高，股票相对债券很便宜
     历史上只有15.2%的时候比现在更高
```

### 案例2：2015年牛市顶点（股债利差 = 1.2%）

```
历史数据：250个数据点
排序后：[-1.2, -0.8, 0.5, 1.0, 1.2, 1.5, ..., 5.5, 6.2]
                              ↑
                           当前值

有多少个值 <= 1.2：约38个
分位值 = (38 / 250) × 100 = 15.2%

解读：当前股债利差处于历史15.2%的位置
     说明股债利差很低，股票相对债券很贵
     历史上有84.8%的时候比现在更高
```

### 案例3：2024年10月（股债利差 = 3.79%）

```
历史数据：250个数据点
排序后：[-1.2, ..., 3.5, 3.79, 4.0, ..., 6.2]
                        ↑
                     当前值

有多少个值 <= 3.79：约82个
分位值 = (82 / 250) × 100 = 32.8%

解读：当前股债利差处于历史32.8%的位置
     说明股债利差处于中等偏低水平
     历史上有67.2%的时候比现在更高
```

## 分位值的投资含义

### 股债利差分位值解读

| 分位值范围 | 含义 | 股票估值 | 投资建议 |
|-----------|------|----------|----------|
| 0-20% | 极低 | 极度高估 | 极度谨慎，考虑减仓 |
| 20-40% | 偏低 | 偏高估 | 谨慎，等待更好时机 |
| 40-60% | 中等 | 合理 | 正常配置 |
| 60-80% | 偏高 | 偏低估 | 积极，可以加仓 |
| 80-100% | 极高 | 极度低估 | 非常积极，重点关注 |

### 为什么股债利差高表示股票便宜？

**股债利差 = 股票收益率 - 债券收益率**

```
例子1：股债利差 = 5.5%（高）
- 股票收益率（盈利/股价）= 8%
- 债券收益率 = 2.5%
- 股债利差 = 8% - 2.5% = 5.5%
→ 股票提供的收益率远高于债券，股票相对便宜

例子2：股债利差 = 1.2%（低）
- 股票收益率（盈利/股价）= 3.5%
- 债券收益率 = 2.3%
- 股债利差 = 3.5% - 2.3% = 1.2%
→ 股票提供的收益率仅略高于债券，股票相对昂贵
```

## 其他指标的分位值计算

### PB分位值

```javascript
// 1. 计算所有历史PB值
const pbValues = allData.map(d => calculatePB(d.windA));

// 2. 排序
pbValues.sort((a, b) => a - b);

// 3. 计算当前PB的排名
const pbRank = pbValues.filter(v => v <= currentPB).length;

// 4. 计算分位值
const pbPercentile = (pbRank / pbValues.length) * 100;
```

**PB分位值解读：**
- PB分位 < 20%：市净率很低，股票便宜
- PB分位 > 80%：市净率很高，股票昂贵

### PE分位值

```javascript
// 计算方法与PB相同
const pePercentile = calculatePercentile(currentPE, allPEValues);
```

**PE分位值解读：**
- PE分位 < 20%：市盈率很低，股票便宜
- PE分位 > 80%：市盈率很高，股票昂贵

## 注意事项

### 1. 数据质量很重要

```javascript
// 需要足够长的历史数据（至少一个完整经济周期）
// 本系统使用2005-2025年，覆盖约20年，包含：
// - 2007-2008年牛熊市
// - 2015年杠杆牛市和股灾
// - 2020年疫情冲击
// - 多个完整的经济周期
```

### 2. 分位值不是绝对指标

```
分位值只表示相对历史位置，不代表：
✗ 未来一定会涨或跌
✗ 当前价格一定合理或不合理
✓ 需要结合其他因素综合判断
✓ 可以作为参考，但不是唯一依据
```

### 3. 极端值的影响

```javascript
// 如果历史数据中有极端值，可能影响分位值
// 例如：2008年金融危机的极端低点
// 建议：使用足够长的时间跨度，包含多个周期
```

## 实际应用示例

### 场景1：判断当前市场位置

```
当前数据（2024-10-29）：
- 股债利差：3.79%
- 股债利差分位：32.8%
- PE：22.77
- PE分位：94.8%

分析：
1. 股债利差分位32.8%：处于历史中等偏低位置
   → 股债利差不算高，股票相对债券不算特别便宜

2. PE分位94.8%：处于历史极高位置
   → 市盈率很高，股票估值昂贵

3. 综合判断：
   → 估值分化，PE极高但股债利差不高
   → 可能是因为债券收益率也较高
   → 建议谨慎，等待更好时机
```

### 场景2：历史回测

```
回测2008年10月（金融危机底部）：
- 股债利差：5.5%
- 股债利差分位：84.8%
- PE：10
- PE分位：5%

分析：
1. 股债利差分位84.8%：历史高位
   → 股票相对债券非常便宜

2. PE分位5%：历史极低位
   → 市盈率很低，股票估值便宜

3. 结论：
   → 双重指标都显示极度低估
   → 历史证明这是很好的买入时机
   → 之后市场大幅反弹
```

## 代码实现（完整版）

```javascript
// 完整的分位值计算函数
function calculateMetrics(dataPoint, allData) {
  const spread = dataPoint.spread;
  const windA = dataPoint.windA;
  
  // 1. 计算股债利差分位
  const spreadValues = allData.map(d => d.spread).sort((a, b) => a - b);
  const spreadRank = spreadValues.filter(v => v <= spread).length;
  const spreadPercentile = ((spreadRank / spreadValues.length) * 100).toFixed(2);
  
  // 2. 估算PB和PE
  const pb = (1.5 * windA / 3000).toFixed(2);
  const pe = (15 * windA / 3000).toFixed(2);
  
  // 3. 计算PB分位
  const pbValues = allData.map(d => (1.5 * d.windA / 3000)).sort((a, b) => a - b);
  const pbRank = pbValues.filter(v => v <= parseFloat(pb)).length;
  const pbPercentile = ((pbRank / pbValues.length) * 100).toFixed(2);
  
  // 4. 计算PE分位
  const peValues = allData.map(d => (15 * d.windA / 3000)).sort((a, b) => a - b);
  const peRank = peValues.filter(v => v <= parseFloat(pe)).length;
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
```

## 总结

**股债利差估值分位 = (历史上有多少个值 ≤ 当前值) / (总数据点数) × 100%**

这个指标帮助我们：
1. ✅ 了解当前市场在历史中的位置
2. ✅ 判断股票相对债券的吸引力
3. ✅ 辅助投资决策
4. ✅ 识别市场极端情况

但要记住：
- ⚠️ 历史不代表未来
- ⚠️ 需要结合其他指标
- ⚠️ 不构成投资建议
- ⚠️ 仅供参考使用
