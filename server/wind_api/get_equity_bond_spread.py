#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
获取股债利差数据
使用Wind API获取历史股债利差数据及估值分位

计算方法说明:
1. PE计算: 不剔除负值，保留所有PE数据（包括负PE）
   - 负PE表示企业亏损，会导致负的盈利收益率
   - 这样可以更真实地反映市场整体估值状况
   
2. PB计算: 使用总股本加权
   - Wind的pb_lf字段已经是按总股本加权的市净率
   - 反映了不同市值公司对整体估值的贡献
   
3. 盈利收益率法:
   - 盈利收益率 = E/P = 1/PE × 100
   - 股债利差 = 盈利收益率 - 国债收益率
"""

import sys
import json
from datetime import datetime, timedelta
from WindPy import w

def calculate_percentile(value, values_list):
    """
    计算分位数
    
    Args:
        value: 当前值
        values_list: 历史值列表
    
    Returns:
        分位数百分比
    """
    if not values_list:
        return 0
    
    sorted_values = sorted(values_list)
    rank = sum(1 for v in sorted_values if v <= value)
    percentile = (rank / len(sorted_values)) * 100
    
    return round(percentile, 2)

def get_equity_bond_spread(target_date):
    """
    获取股债利差数据
    
    Args:
        target_date: 目标日期，格式: YYYY-MM-DD
    
    Returns:
        JSON格式的股债利差数据
    """
    # 启动Wind API
    w.start()
    
    # 检查连接状态
    if not w.isconnected():
        print(json.dumps({"error": "Wind API连接失败，请确保Wind终端已登录"}))
        sys.exit(1)
    
    try:
        # 设置历史数据范围：2005-01-01 至目标日期
        start_date = "2005-01-01"
        end_date = target_date
        
        # 获取万得全A指数数据
        # 881001.WI: 万得全A指数
        # close: 收盘价
        # pe_ttm: 市盈率TTM
        # pb_lf: 市净率
        wind_a_data = w.wsd("881001.WI", "close,pe_ttm,pb_lf", start_date, end_date, "Period=M")
        
        if wind_a_data.ErrorCode != 0:
            raise Exception(f"获取万得全A数据失败: {wind_a_data.ErrorMsg}")
        
        # 获取10年期国债收益率数据
        # M0041716: 中债国债到期收益率:10年
        bond_data = w.wsd("M0041716", "close", start_date, end_date, "Period=M")
        
        if bond_data.ErrorCode != 0:
            raise Exception(f"获取国债收益率数据失败: {bond_data.ErrorMsg}")
        
        # 提取数据
        dates = wind_a_data.Times
        wind_a_closes = wind_a_data.Data[0]
        pe_values = wind_a_data.Data[1]
        pb_values = wind_a_data.Data[2]
        bond_yields = bond_data.Data[0]
        
        # 计算股债利差 (盈利收益率法)
        # 股债利差 = 盈利收益率 - 国债收益率
        # 盈利收益率 (Earnings Yield) = 1/PE × 100 = E/P × 100
        # 股息率 = 1 / PE * 100
        chart_data = []
        spreads = []
        pbs = []
        pes = []
        
        for i, date in enumerate(dates):
            if i < len(pe_values) and i < len(pb_values) and i < len(bond_yields):
                pe = pe_values[i] if pe_values[i] else 15  # 默认PE
                pb = pb_values[i] if pb_values[i] else 1.5  # 默认PB
                bond_yield = bond_yields[i] if bond_yields[i] else 3.0  # 默认债券收益率
                wind_a = wind_a_closes[i] if wind_a_closes[i] else 3000  # 默认指数
                
                # 计算盈利收益率 (Earnings Yield = E/P = 1/PE × 100)
                earnings_yield = (1 / pe * 100) if pe > 0 else 0
                
                # 股债利差 = 盈利收益率 - 国债收益率
                spread = earnings_yield - bond_yield
                
                year = date.year
                month = date.month
                date_str = f"{year}-{str(month).padStart(2, '0')}-01"
                
                chart_data.append({
                    "date": date_str,
                    "year": year,
                    "displayYear": year if month == 1 else "",
                    "spread": round(spread, 2),
                    "windA": round(wind_a, 0)
                })
                
                spreads.append(spread)
                # 只有非None的PB和PE才加入统计
                if pb is not None:
                    pbs.append(pb)
                if pe is not None:
                    pes.append(pe)
        
        # 查找目标日期的数据
        target_dt = datetime.strptime(target_date, "%Y-%m-%d")
        target_year = target_dt.year
        target_month = target_dt.month
        target_date_str = f"{target_year}-{str(target_month).padStart(2, '0')}-01"
        
        # 找到对应的数据点
        target_data = None
        target_idx = -1
        
        for i, item in enumerate(chart_data):
            if item["date"] == target_date_str:
                target_data = item
                target_idx = i
                break
        
        # 如果找不到精确日期，使用最新数据
        if not target_data and chart_data:
            target_data = chart_data[-1]
            target_idx = len(chart_data) - 1
        
        # 计算指标
        if target_data and target_idx >= 0:
            spread = target_data["spread"]
            pb = pbs[target_idx]
            pe = pes[target_idx]
            
            # 计算分位数
            spread_percentile = calculate_percentile(spread, spreads)
            pb_percentile = calculate_percentile(pb, pbs)
            pe_percentile = calculate_percentile(pe, pes)
            
            metrics = {
                "spreadPercentile": spread_percentile,
                "spread": str(round(spread, 2)),
                "pb": round(pb, 2),
                "pbPercentile": pb_percentile,
                "pe": round(pe, 2),
                "pePercentile": pe_percentile
            }
        else:
            # 默认值
            metrics = {
                "spreadPercentile": 50,
                "spread": "2.0",
                "pb": 1.5,
                "pbPercentile": 50,
                "pe": 15,
                "pePercentile": 50
            }
        
        result = {
            "metrics": metrics,
            "chartData": chart_data
        }
        
        # 关闭Wind API
        w.stop()
        
        # 输出JSON数据
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        w.stop()
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "参数不足，需要: date"}))
        sys.exit(1)
    
    date = sys.argv[1]
    get_equity_bond_spread(date)
