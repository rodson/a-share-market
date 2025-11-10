#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
获取市场概况数据
使用Wind API获取指定日期的市场整体情况
"""

import sys
import json
from WindPy import w

def get_market_overview(date):
    """
    获取市场概况
    
    Args:
        date: 日期，格式: YYYY-MM-DD
    
    Returns:
        JSON格式的市场概况数据
    """
    # 启动Wind API
    w.start()
    
    # 检查连接状态
    if not w.isconnected():
        print(json.dumps({"error": "Wind API连接失败，请确保Wind终端已登录"}))
        sys.exit(1)
    
    try:
        # 获取A股市场统计数据
        # 使用wset函数获取市场统计
        # sectorconstituent: 板块成分
        # tradestatus: 交易状态统计
        
        # 获取全部A股列表
        all_stocks = w.wset("sectorconstituent", f"date={date};windcode=a001010100000000")
        
        if all_stocks.ErrorCode != 0:
            # 如果获取失败，返回默认值
            result = {
                "upLimit": 0,
                "up": 0,
                "flat": 0,
                "down": 0,
                "downLimit": 0,
                "changePercent": 0
            }
        else:
            # 提取股票代码列表
            stock_codes = all_stocks.Data[1] if all_stocks.Data and len(all_stocks.Data) > 1 else []
            
            if not stock_codes:
                result = {
                    "upLimit": 0,
                    "up": 0,
                    "flat": 0,
                    "down": 0,
                    "downLimit": 0,
                    "changePercent": 0
                }
            else:
                # 获取所有股票的涨跌幅
                stocks_data = w.wss(stock_codes, "pct_chg", f"tradeDate={date}")
                
                if stocks_data.ErrorCode != 0:
                    result = {
                        "upLimit": 0,
                        "up": 0,
                        "flat": 0,
                        "down": 0,
                        "downLimit": 0,
                        "changePercent": 0
                    }
                else:
                    # 统计涨跌家数
                    changes = stocks_data.Data[0] if stocks_data.Data and len(stocks_data.Data) > 0 else []
                    
                    up_limit = sum(1 for c in changes if c and c >= 9.9)  # 涨停
                    up = sum(1 for c in changes if c and 0 < c < 9.9)     # 上涨
                    flat = sum(1 for c in changes if c and c == 0)        # 平盘
                    down = sum(1 for c in changes if c and -9.9 < c < 0)  # 下跌
                    down_limit = sum(1 for c in changes if c and c <= -9.9)  # 跌停
                    
                    # 计算整体涨跌幅（上涨家数占比）
                    total = len(changes)
                    change_percent = (up / total * 100) if total > 0 else 0
                    
                    result = {
                        "upLimit": up_limit,
                        "up": up,
                        "flat": flat,
                        "down": down,
                        "downLimit": down_limit,
                        "changePercent": round(change_percent, 2)
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
    get_market_overview(date)
