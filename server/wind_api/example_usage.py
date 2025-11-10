#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Wind API 使用示例
演示如何使用WindPy获取各类金融数据
"""

from WindPy import w
import json

def example_1_get_index_data():
    """示例1: 获取指数数据"""
    print("\n" + "="*60)
    print("示例1: 获取上证指数最近5天的数据")
    print("="*60)
    
    w.start()
    
    # 获取上证指数数据
    # wsd: 获取日线数据
    # 参数: 代码, 字段, 开始日期, 结束日期, 其他参数
    data = w.wsd("000001.SH", "close,pct_chg,volume,amt", 
                 "2024-01-02", "2024-01-08", "")
    
    if data.ErrorCode == 0:
        print("✓ 数据获取成功")
        print("\n日期:", data.Times)
        print("收盘价:", data.Data[0])
        print("涨跌幅(%):", data.Data[1])
        print("成交量(手):", data.Data[2])
        print("成交额(万元):", data.Data[3])
    else:
        print(f"✗ 错误: {data.ErrorMsg}")
    
    w.stop()

def example_2_get_multiple_indices():
    """示例2: 获取多个指数数据"""
    print("\n" + "="*60)
    print("示例2: 同时获取多个指数数据")
    print("="*60)
    
    w.start()
    
    # 使用wss获取多个证券的截面数据
    codes = "000001.SH,399001.SZ,399006.SZ"
    data = w.wss(codes, "close,pct_chg", "tradeDate=2024-01-02")
    
    if data.ErrorCode == 0:
        print("✓ 数据获取成功")
        print("\n证券代码:", data.Codes)
        print("收盘价:", data.Data[0])
        print("涨跌幅(%):", data.Data[1])
    else:
        print(f"✗ 错误: {data.ErrorMsg}")
    
    w.stop()

def example_3_get_sector_constituents():
    """示例3: 获取板块成分股"""
    print("\n" + "="*60)
    print("示例3: 获取板块成分股")
    print("="*60)
    
    w.start()
    
    # 获取沪深300成分股
    data = w.wset("sectorconstituent", "date=2024-01-02;windcode=000300.SH")
    
    if data.ErrorCode == 0:
        print("✓ 数据获取成功")
        print(f"\n成分股数量: {len(data.Data[0])}")
        print("前10只成分股:")
        for i in range(min(10, len(data.Data[1]))):
            print(f"  {data.Data[1][i]} - {data.Data[2][i]}")
    else:
        print(f"✗ 错误: {data.ErrorMsg}")
    
    w.stop()

def example_4_get_market_stats():
    """示例4: 获取市场统计数据"""
    print("\n" + "="*60)
    print("示例4: 获取A股市场涨跌统计")
    print("="*60)
    
    w.start()
    
    # 获取全部A股
    all_stocks = w.wset("sectorconstituent", "date=2024-01-02;windcode=a001010100000000")
    
    if all_stocks.ErrorCode == 0:
        stock_codes = all_stocks.Data[1][:100]  # 只取前100只做示例
        
        # 获取涨跌幅
        stocks_data = w.wss(stock_codes, "pct_chg", "tradeDate=2024-01-02")
        
        if stocks_data.ErrorCode == 0:
            changes = [c for c in stocks_data.Data[0] if c is not None]
            
            up_count = sum(1 for c in changes if c > 0)
            down_count = sum(1 for c in changes if c < 0)
            flat_count = sum(1 for c in changes if c == 0)
            
            print("✓ 数据获取成功")
            print(f"\n统计(前100只):")
            print(f"  上涨: {up_count}")
            print(f"  下跌: {down_count}")
            print(f"  平盘: {flat_count}")
        else:
            print(f"✗ 获取涨跌幅失败: {stocks_data.ErrorMsg}")
    else:
        print(f"✗ 获取股票列表失败: {all_stocks.ErrorMsg}")
    
    w.stop()

def example_5_get_valuation_data():
    """示例5: 获取估值数据"""
    print("\n" + "="*60)
    print("示例5: 获取万得全A的估值数据")
    print("="*60)
    
    w.start()
    
    # 获取万得全A指数的PE、PB
    data = w.wsd("881001.WI", "pe_ttm,pb_lf", "2024-01-02", "2024-01-02", "")
    
    if data.ErrorCode == 0:
        print("✓ 数据获取成功")
        print(f"\n万得全A (2024-01-02):")
        print(f"  市盈率TTM: {data.Data[0][0]}")
        print(f"  市净率: {data.Data[1][0]}")
    else:
        print(f"✗ 错误: {data.ErrorMsg}")
    
    w.stop()

def example_6_get_bond_yield():
    """示例6: 获取国债收益率"""
    print("\n" + "="*60)
    print("示例6: 获取10年期国债收益率")
    print("="*60)
    
    w.start()
    
    # 获取10年期国债收益率
    data = w.wsd("M0041716", "close", "2024-01-02", "2024-01-08", "")
    
    if data.ErrorCode == 0:
        print("✓ 数据获取成功")
        print("\n日期:", data.Times)
        print("收益率(%):", data.Data[0])
    else:
        print(f"✗ 错误: {data.ErrorMsg}")
    
    w.stop()

def example_7_export_to_json():
    """示例7: 导出数据为JSON格式"""
    print("\n" + "="*60)
    print("示例7: 导出数据为JSON格式")
    print("="*60)
    
    w.start()
    
    # 获取指数数据
    data = w.wss("000001.SH,399001.SZ,399006.SZ", 
                 "close,pct_chg,volume,amt", 
                 "tradeDate=2024-01-02")
    
    if data.ErrorCode == 0:
        # 构建JSON数据
        result = []
        for i, code in enumerate(data.Codes):
            result.append({
                "code": code,
                "close": data.Data[0][i],
                "pct_chg": data.Data[1][i],
                "volume": data.Data[2][i],
                "amt": data.Data[3][i]
            })
        
        print("✓ 数据获取成功")
        print("\nJSON格式:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"✗ 错误: {data.ErrorMsg}")
    
    w.stop()

def show_common_codes():
    """显示常用Wind代码"""
    print("\n" + "="*60)
    print("常用Wind代码参考")
    print("="*60)
    
    codes = {
        "主要指数": {
            "000001.SH": "上证指数",
            "399001.SZ": "深证成指",
            "399006.SZ": "创业板指",
            "000300.SH": "沪深300",
            "000016.SH": "上证50",
            "000905.SH": "中证500",
            "000688.SH": "科创50",
            "881001.WI": "万得全A"
        },
        "行业指数": {
            "881001.WI": "银行",
            "881002.WI": "证券",
            "881003.WI": "保险",
            "881004.WI": "工业"
        },
        "债券指标": {
            "M0041716": "中债国债到期收益率:10年",
            "M0041717": "中债国债到期收益率:5年"
        }
    }
    
    for category, items in codes.items():
        print(f"\n{category}:")
        for code, name in items.items():
            print(f"  {code:15} {name}")

def show_common_functions():
    """显示常用Wind API函数"""
    print("\n" + "="*60)
    print("常用Wind API函数")
    print("="*60)
    
    functions = {
        "w.wsd()": "获取日线数据 (时间序列)",
        "w.wss()": "获取截面数据 (多个证券)",
        "w.wsi()": "获取分钟数据",
        "w.wst()": "获取tick数据",
        "w.wset()": "获取板块数据、成分股等",
        "w.edb()": "获取宏观经济数据"
    }
    
    print("\n函数列表:")
    for func, desc in functions.items():
        print(f"  {func:15} {desc}")
    
    print("\n常用字段:")
    fields = {
        "close": "收盘价",
        "open": "开盘价",
        "high": "最高价",
        "low": "最低价",
        "volume": "成交量(手)",
        "amt": "成交额(万元)",
        "pct_chg": "涨跌幅(%)",
        "pe_ttm": "市盈率TTM",
        "pb_lf": "市净率"
    }
    
    for field, desc in fields.items():
        print(f"  {field:15} {desc}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Wind API 使用示例")
    print("="*60)
    print("\n本脚本演示了Wind API的常用功能")
    print("请确保Wind终端已启动并登录\n")
    
    try:
        # 显示参考信息
        show_common_codes()
        show_common_functions()
        
        # 运行示例
        example_1_get_index_data()
        example_2_get_multiple_indices()
        example_3_get_sector_constituents()
        example_4_get_market_stats()
        example_5_get_valuation_data()
        example_6_get_bond_yield()
        example_7_export_to_json()
        
        print("\n" + "="*60)
        print("所有示例运行完成!")
        print("="*60)
        
    except Exception as e:
        print(f"\n错误: {e}")
        print("\n请确保:")
        print("  1. Wind金融终端已安装")
        print("  2. Wind终端正在运行")
        print("  3. Wind终端已登录")
        print("  4. WindPy已正确安装")
