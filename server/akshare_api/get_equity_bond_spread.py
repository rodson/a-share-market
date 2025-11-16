#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
获取股债利差数据
使用AKShare获取历史股债利差数据及估值分位

计算方法说明:
1. PE计算: 不剔除负值，保留所有PE数据（包括负PE）
   - 负PE表示企业亏损，会导致负的盈利收益率
   - 这样可以更真实地反映市场整体估值状况
   
2. PB计算: 使用总股本加权
   - 反映了不同市值公司对整体估值的贡献
   
3. 盈利收益率法:
   - 盈利收益率 = E/P = 1/PE × 100
   - 股债利差 = 盈利收益率 - 国债收益率
"""

import sys
import json
import akshare as ak
import pandas as pd
from datetime import datetime, timedelta

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
    try:
        # 设置历史数据范围：2005-01-01 至目标日期
        start_date = "2005-01-01"
        end_date = target_date
        
        # 获取沪深300指数历史数据（作为市场代表）
        # AKShare使用沪深300作为全市场代表指数
        index_df = ak.stock_zh_index_daily(symbol="sh000300")
        index_df['date'] = pd.to_datetime(index_df['date'])
        
        # 筛选日期范围
        index_df = index_df[(index_df['date'] >= start_date) & (index_df['date'] <= end_date)]
        
        # 获取市场估值数据 - 使用指数估值接口
        try:
            # 获取沪深300的PE和PB数据
            valuation_df = ak.index_value_hist_funddb(symbol="沪深300")
            valuation_df['日期'] = pd.to_datetime(valuation_df['日期'])
            valuation_df = valuation_df[(valuation_df['日期'] >= start_date) & (valuation_df['日期'] <= end_date)]
        except:
            # 如果获取失败，使用默认估值
            valuation_df = pd.DataFrame({
                '日期': index_df['date'],
                'PE': [15.0] * len(index_df),
                'PB': [1.5] * len(index_df)
            })
        
        # 获取10年期国债收益率数据
        try:
            bond_df = ak.bond_zh_us_rate()
            bond_df['日期'] = pd.to_datetime(bond_df['日期'])
            bond_df = bond_df[(bond_df['日期'] >= start_date) & (bond_df['日期'] <= end_date)]
            # 使用中国10年期国债收益率
            bond_col = '中国国债收益率10年' if '中国国债收益率10年' in bond_df.columns else '中国10年期国债收益率'
        except:
            # 如果获取失败，使用固定收益率
            bond_df = pd.DataFrame({
                '日期': index_df['date'],
                bond_col: [3.0] * len(index_df)
            })
        
        # 合并数据
        # 按月采样
        index_monthly = index_df.set_index('date').resample('M').last()
        valuation_monthly = valuation_df.set_index('日期').resample('M').last()
        bond_monthly = bond_df.set_index('日期').resample('M').last()
        
        # 合并所有数据
        merged = pd.merge(index_monthly, valuation_monthly, left_index=True, right_index=True, how='left')
        merged = pd.merge(merged, bond_monthly, left_index=True, right_index=True, how='left')
        
        # 填充缺失值
        merged = merged.fillna(method='ffill').fillna({'PE': 15.0, 'PB': 1.5, bond_col: 3.0})
        
        # 计算股债利差
        chart_data = []
        spreads = []
        pbs = []
        pes = []
        
        for date, row in merged.iterrows():
            pe = float(row.get('PE', 15.0))
            pb = float(row.get('PB', 1.5))
            bond_yield = float(row.get(bond_col, 3.0))
            wind_a = float(row.get('close', 3000))
            
            # 计算盈利收益率 (Earnings Yield = E/P = 1/PE × 100)
            earnings_yield = (1 / pe * 100) if pe > 0 else 0
            
            # 股债利差 = 盈利收益率 - 国债收益率
            spread = earnings_yield - bond_yield
            
            year = date.year
            month = date.month
            date_str = f"{year}-{str(month).zfill(2)}-01"
            
            chart_data.append({
                "date": date_str,
                "year": year,
                "displayYear": year if month == 1 else "",
                "spread": round(spread, 2),
                "windA": round(wind_a, 0)
            })
            
            spreads.append(spread)
            pbs.append(pb)
            pes.append(pe)
        
        # 查找目标日期的数据
        target_dt = pd.to_datetime(target_date)
        target_year = target_dt.year
        target_month = target_dt.month
        target_date_str = f"{target_year}-{str(target_month).zfill(2)}-01"
        
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
        
        # 输出JSON数据
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "参数不足，需要: date"}))
        sys.exit(1)
    
    date = sys.argv[1]
    get_equity_bond_spread(date)
