#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
获取板块数据
使用AKShare获取指定日期的板块行情数据
"""

import sys
import json
import akshare as ak
import pandas as pd
from datetime import datetime

# 板块配置
SECTOR_CONFIGS = {
    "指数": [
        {"code": "上证50", "name": "上证50"},
        {"code": "沪深300", "name": "沪深300"},
        {"code": "中证500", "name": "中证500"},
        {"code": "创业板50", "name": "创业板50"},
        {"code": "科创50", "name": "科创50"},
    ],
    "金融": [
        {"code": "银行", "name": "银行"},
        {"code": "证券", "name": "证券"},
        {"code": "保险", "name": "保险"},
    ],
    "工业": [
        {"code": "工业", "name": "工业"},
        {"code": "工程机械", "name": "工程机械"},
    ],
    "原材料": [
        {"code": "原材料", "name": "原材料"},
        {"code": "钢铁", "name": "钢铁"},
        {"code": "有色金属", "name": "有色金属"},
    ],
    "消费": [
        {"code": "消费", "name": "消费"},
        {"code": "汽车", "name": "汽车"},
        {"code": "新能源汽车", "name": "新能源汽车"},
        {"code": "食品饮料", "name": "食品饮料"},
        {"code": "白酒", "name": "白酒"},
    ],
    "医疗保健": [
        {"code": "医疗保健", "name": "医疗保健"},
        {"code": "医疗器械", "name": "医疗器械"},
        {"code": "医药", "name": "医药"},
    ],
    "信息技术": [
        {"code": "信息技术", "name": "信息技术"},
        {"code": "半导体", "name": "半导体"},
        {"code": "芯片", "name": "芯片"},
        {"code": "消费电子", "name": "消费电子"},
    ],
    "新能源": [
        {"code": "新能源", "name": "新能源"},
        {"code": "光伏", "name": "光伏"},
        {"code": "锂电池", "name": "锂电池"},
    ],
}

def get_sector_data(sector_name):
    """
    获取单个板块数据（带重试机制）
    
    Args:
        sector_name: 板块名称
    
    Returns:
        板块数据字典
    """
    max_retries = 2
    
    for attempt in range(max_retries):
        try:
            # 获取东方财富板块行情数据
            df = ak.stock_board_industry_name_em()
            
            # 查找对应板块
            sector_row = df[df['板块名称'] == sector_name]
            
            if sector_row.empty:
                # 如果找不到，返回默认值
                return {
                    "changePercent": 0,
                    "topGainer": {"name": "", "changePercent": 0},
                    "topLoser": {"name": "", "changePercent": 0},
                    "upCount": 0,
                    "downCount": 0
                }
            
            # 获取板块涨跌幅
            pct_chg = float(sector_row.iloc[0]['涨跌幅']) if '涨跌幅' in sector_row.columns else 0
            
            # 获取板块成分股
            try:
                constituents_df = ak.stock_board_industry_cons_em(symbol=sector_name)
                
                if not constituents_df.empty and '涨跌幅' in constituents_df.columns:
                    # 转换涨跌幅为数值
                    changes = pd.to_numeric(constituents_df['涨跌幅'], errors='coerce').fillna(0)
                    names = constituents_df['名称'] if '名称' in constituents_df.columns else constituents_df['股票名称'] if '股票名称' in constituents_df.columns else constituents_df.index
                    
                    # 统计涨跌家数
                    up_count = len(changes[changes > 0])
                    down_count = len(changes[changes < 0])
                    
                    # 找出涨幅最大和最小的股票
                    if len(changes) > 0:
                        max_idx = changes.idxmax()
                        min_idx = changes.idxmin()
                        
                        top_gainer = {
                            "name": str(names.iloc[max_idx]) if max_idx in names.index else "",
                            "changePercent": round(float(changes.iloc[max_idx]), 2)
                        }
                        
                        top_loser = {
                            "name": str(names.iloc[min_idx]) if min_idx in names.index else "",
                            "changePercent": round(float(changes.iloc[min_idx]), 2)
                        }
                    else:
                        top_gainer = {"name": "", "changePercent": 0}
                        top_loser = {"name": "", "changePercent": 0}
                else:
                    up_count = 0
                    down_count = 0
                    top_gainer = {"name": "", "changePercent": 0}
                    top_loser = {"name": "", "changePercent": 0}
            
            except Exception as e:
                up_count = 0
                down_count = 0
                top_gainer = {"name": "", "changePercent": 0}
                top_loser = {"name": "", "changePercent": 0}
            
            return {
                "changePercent": round(float(pct_chg), 2),
                "topGainer": top_gainer,
                "topLoser": top_loser,
                "upCount": int(up_count),
                "downCount": int(down_count)
            }
        
        except Exception as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(2)
                continue
            else:
                # 最后一次尝试失败，返回默认值
                return {
                    "changePercent": 0,
                    "topGainer": {"name": "", "changePercent": 0},
                    "topLoser": {"name": "", "changePercent": 0},
                    "upCount": 0,
                    "downCount": 0,
                    "error": str(e)
                }

def get_sectors_data(date):
    """
    获取所有板块数据
    
    Args:
        date: 日期，格式: YYYY-MM-DD
    
    Returns:
        JSON格式的板块数据
    """
    result = []
    
    # 遍历所有板块
    for category, sectors in SECTOR_CONFIGS.items():
        for sector in sectors:
            sector_data = get_sector_data(sector["code"])
            
            result.append({
                "category": category,
                "name": sector["name"],
                **sector_data
            })
    
    # 输出JSON数据
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "参数不足，需要: date"}))
        sys.exit(1)
    
    date = sys.argv[1]
    get_sectors_data(date)
