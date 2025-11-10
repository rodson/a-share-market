#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
获取指数数据
使用Wind API获取指定日期的指数行情数据
"""

import sys
import json
from WindPy import w

def get_indices_data(codes, date):
    """
    获取指数数据
    
    Args:
        codes: 指数代码列表，逗号分隔，如: "000001.SH,399001.SZ"
        date: 日期，格式: YYYY-MM-DD
    
    Returns:
        JSON格式的指数数据
    """
    # 启动Wind API
    w.start()
    
    # 检查连接状态
    if not w.isconnected():
        print(json.dumps({"error": "Wind API连接失败，请确保Wind终端已登录"}))
        sys.exit(1)
    
    # 分割代码列表
    code_list = codes.split(',')
    
    result = []
    
    for code in code_list:
        # 获取指数数据
        # 字段说明:
        # pct_chg: 涨跌幅(%)
        # volume: 成交量(手)
        # amt: 成交额(万元)
        data = w.wsd(code, "pct_chg,volume,amt", date, date, "")
        
        if data.ErrorCode != 0:
            # 如果获取失败，返回空数据
            result.append({
                "code": code,
                "pct_chg": 0,
                "volume": 0,
                "amt": 0,
                "error": data.ErrorMsg
            })
        else:
            # 提取数据
            pct_chg = data.Data[0][0] if data.Data[0] and len(data.Data[0]) > 0 else 0
            volume = data.Data[1][0] if data.Data[1] and len(data.Data[1]) > 0 else 0
            amt = data.Data[2][0] if data.Data[2] and len(data.Data[2]) > 0 else 0
            
            result.append({
                "code": code,
                "pct_chg": float(pct_chg) if pct_chg else 0,
                "volume": float(volume) if volume else 0,
                "amt": float(amt) if amt else 0
            })
    
    # 关闭Wind API
    w.stop()
    
    # 输出JSON数据
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "参数不足，需要: codes date"}))
        sys.exit(1)
    
    codes = sys.argv[1]
    date = sys.argv[2]
    
    get_indices_data(codes, date)
