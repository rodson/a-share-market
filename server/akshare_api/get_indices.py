#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
获取指数数据
使用AKShare获取指定日期的指数行情数据
"""

import sys
import json
import akshare as ak
import pandas as pd
from datetime import datetime

def get_indices_data(codes, date):
    """
    获取指数数据
    
    Args:
        codes: 指数代码列表，逗号分隔，如: "000001.SH,399001.SZ"
        date: 日期，格式: YYYY-MM-DD
    
    Returns:
        JSON格式的指数数据
    """
    # 分割代码列表
    code_list = codes.split(',')
    
    # AKShare指数代码映射
    # Wind格式 -> AKShare格式
    code_mapping = {
        "000001.SH": "000001",  # 上证指数
        "399001.SZ": "399001",  # 深证成指
        "399006.SZ": "399006",  # 创业板指
        "399005.SZ": "399005",  # 中小板指
        "000300.SH": "000300",  # 沪深300
        "000016.SH": "000016",  # 上证50
    }
    
    result = []
    
    for code in code_list:
        try:
            # 转换代码格式
            ak_code = code_mapping.get(code, code.split('.')[0])
            
            # 获取指数历史行情
            df = ak.stock_zh_index_daily(symbol=f"sh{ak_code}" if code.endswith('.SH') else f"sz{ak_code}")
            
            # 转换日期格式
            df['date'] = pd.to_datetime(df['date'])
            target_date = pd.to_datetime(date)
            
            # 筛选指定日期的数据
            day_data = df[df['date'] == target_date]
            
            if day_data.empty:
                # 如果没有数据，尝试获取最近的数据
                day_data = df[df['date'] <= target_date].tail(1)
            
            if not day_data.empty:
                # 计算涨跌幅
                close = float(day_data.iloc[0]['close'])
                open_price = float(day_data.iloc[0]['open'])
                
                # 获取前一天的收盘价来计算涨跌幅
                idx = df[df['date'] == day_data.iloc[0]['date']].index[0]
                if idx > 0:
                    prev_close = float(df.iloc[idx - 1]['close'])
                    pct_chg = ((close - prev_close) / prev_close) * 100
                else:
                    pct_chg = 0
                
                volume = float(day_data.iloc[0]['volume']) if 'volume' in day_data.columns else 0
                
                result.append({
                    "code": code,
                    "pct_chg": round(pct_chg, 2),
                    "volume": volume,
                    "amt": 0  # AKShare部分数据源可能不包含成交额
                })
            else:
                result.append({
                    "code": code,
                    "pct_chg": 0,
                    "volume": 0,
                    "amt": 0
                })
        
        except Exception as e:
            # 如果获取失败，返回空数据
            result.append({
                "code": code,
                "pct_chg": 0,
                "volume": 0,
                "amt": 0,
                "error": str(e)
            })
    
    # 输出JSON数据
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "参数不足，需要: codes date"}))
        sys.exit(1)
    
    codes = sys.argv[1]
    date = sys.argv[2]
    
    get_indices_data(codes, date)
