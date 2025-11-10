#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
获取板块数据
使用Wind API获取指定日期的板块行情数据
"""

import sys
import json
from WindPy import w

# 板块配置
SECTOR_CONFIGS = {
    "指数": [
        {"code": "000016.SH", "name": "上证50"},
        {"code": "000300.SH", "name": "沪深300"},
        {"code": "000905.SH", "name": "中证500"},
        {"code": "399006.SZ", "name": "创业板50"},
        {"code": "000688.SH", "name": "科创50"},
    ],
    "金融": [
        {"code": "881001.WI", "name": "银行"},
        {"code": "881002.WI", "name": "证券"},
        {"code": "881003.WI", "name": "保险"},
    ],
    "工业": [
        {"code": "881004.WI", "name": "工业"},
        {"code": "881005.WI", "name": "工程机械"},
    ],
    "原材料": [
        {"code": "881006.WI", "name": "原材料"},
        {"code": "881007.WI", "name": "钢铁"},
        {"code": "881008.WI", "name": "有色金属"},
    ],
    "消费": [
        {"code": "881009.WI", "name": "可选消费"},
        {"code": "881010.WI", "name": "汽车"},
        {"code": "881011.WI", "name": "新能源汽车"},
        {"code": "881012.WI", "name": "日常消费"},
        {"code": "881013.WI", "name": "白酒"},
    ],
    "医疗保健": [
        {"code": "881014.WI", "name": "医疗保健"},
        {"code": "881015.WI", "name": "医疗器械"},
        {"code": "881016.WI", "name": "医药"},
    ],
    "信息技术": [
        {"code": "881017.WI", "name": "信息技术"},
        {"code": "881018.WI", "name": "半导体"},
        {"code": "881019.WI", "name": "芯片"},
        {"code": "881020.WI", "name": "消费电子"},
    ],
    "新能源": [
        {"code": "881021.WI", "name": "新能源"},
        {"code": "881022.WI", "name": "光伏"},
        {"code": "881023.WI", "name": "锂电池"},
    ],
}

def get_sector_constituents(sector_code, date):
    """
    获取板块成分股
    
    Args:
        sector_code: 板块代码
        date: 日期
    
    Returns:
        成分股代码列表
    """
    data = w.wset("sectorconstituent", f"date={date};windcode={sector_code}")
    
    if data.ErrorCode != 0:
        return []
    
    # 提取成分股代码
    if data.Data and len(data.Data) > 0:
        return data.Data[1]  # 通常第二列是股票代码
    
    return []

def get_sector_data(sector_code, date):
    """
    获取单个板块数据
    
    Args:
        sector_code: 板块代码
        date: 日期
    
    Returns:
        板块数据字典
    """
    # 获取板块涨跌幅
    sector_data = w.wsd(sector_code, "pct_chg", date, date, "")
    
    if sector_data.ErrorCode != 0:
        return None
    
    pct_chg = sector_data.Data[0][0] if sector_data.Data[0] and len(sector_data.Data[0]) > 0 else 0
    
    # 获取成分股
    constituents = get_sector_constituents(sector_code, date)
    
    if not constituents:
        return {
            "changePercent": float(pct_chg) if pct_chg else 0,
            "topGainer": {"name": "", "changePercent": 0},
            "topLoser": {"name": "", "changePercent": 0},
            "upCount": 0,
            "downCount": 0
        }
    
    # 获取成分股涨跌幅
    stocks_data = w.wss(constituents, "pct_chg,sec_name", f"tradeDate={date}")
    
    if stocks_data.ErrorCode != 0:
        return {
            "changePercent": float(pct_chg) if pct_chg else 0,
            "topGainer": {"name": "", "changePercent": 0},
            "topLoser": {"name": "", "changePercent": 0},
            "upCount": 0,
            "downCount": 0
        }
    
    # 解析成分股数据
    stock_changes = []
    stock_names = {}
    
    if stocks_data.Data and len(stocks_data.Data) >= 2:
        changes = stocks_data.Data[0]  # 涨跌幅
        names = stocks_data.Data[1]    # 股票名称
        
        for i, code in enumerate(constituents):
            if i < len(changes) and i < len(names):
                change = changes[i] if changes[i] else 0
                name = names[i] if names[i] else code
                stock_changes.append(float(change))
                stock_names[code] = name
    
    # 统计涨跌家数
    up_count = sum(1 for c in stock_changes if c > 0)
    down_count = sum(1 for c in stock_changes if c < 0)
    
    # 找出涨幅最大和最小的股票
    max_change = max(stock_changes) if stock_changes else 0
    min_change = min(stock_changes) if stock_changes else 0
    
    max_idx = stock_changes.index(max_change) if stock_changes else -1
    min_idx = stock_changes.index(min_change) if stock_changes else -1
    
    top_gainer = {
        "name": stock_names.get(constituents[max_idx], "") if max_idx >= 0 else "",
        "changePercent": max_change
    }
    
    top_loser = {
        "name": stock_names.get(constituents[min_idx], "") if min_idx >= 0 else "",
        "changePercent": min_change
    }
    
    return {
        "changePercent": float(pct_chg) if pct_chg else 0,
        "topGainer": top_gainer,
        "topLoser": top_loser,
        "upCount": up_count,
        "downCount": down_count
    }

def get_sectors_data(date):
    """
    获取所有板块数据
    
    Args:
        date: 日期，格式: YYYY-MM-DD
    
    Returns:
        JSON格式的板块数据
    """
    # 启动Wind API
    w.start()
    
    # 检查连接状态
    if not w.isconnected():
        print(json.dumps({"error": "Wind API连接失败，请确保Wind终端已登录"}))
        sys.exit(1)
    
    result = []
    
    # 遍历所有板块
    for category, sectors in SECTOR_CONFIGS.items():
        for sector in sectors:
            sector_data = get_sector_data(sector["code"], date)
            
            if sector_data:
                result.append({
                    "category": category,
                    "name": sector["name"],
                    **sector_data
                })
    
    # 关闭Wind API
    w.stop()
    
    # 输出JSON数据
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "参数不足，需要: date"}))
        sys.exit(1)
    
    date = sys.argv[1]
    get_sectors_data(date)
