#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
AKShare 诊断工具
快速检测各个数据接口的状态
"""

import sys
import json
from datetime import datetime, timedelta

def test_interface(name, func, *args):
    """测试单个接口"""
    print(f"\n[测试] {name}...")
    try:
        result = func(*args)
        if result:
            print(f"  ✅ 成功")
            return True
        else:
            print(f"  ⚠️  返回空数据")
            return False
    except Exception as e:
        print(f"  ❌ 失败: {str(e)[:100]}")
        return False

def main():
    """主诊断流程"""
    print("=" * 60)
    print("AKShare 数据接口诊断")
    print("=" * 60)
    
    # 导入测试
    print("\n[1/6] 导入模块测试...")
    try:
        import akshare as ak
        import pandas as pd
        import urllib3
        print(f"  ✅ akshare {ak.__version__}")
        print(f"  ✅ pandas {pd.__version__}")
        print(f"  ✅ urllib3 {urllib3.__version__}")
    except Exception as e:
        print(f"  ❌ 导入失败: {e}")
        return
    
    # 网络测试
    print("\n[2/6] 网络连接测试...")
    try:
        import requests
        response = requests.get("https://www.baidu.com", timeout=5)
        print(f"  ✅ 网络正常")
    except Exception as e:
        print(f"  ⚠️  网络可能有问题: {str(e)[:50]}")
    
    # 指数数据测试
    print("\n[3/6] 指数数据接口...")
    try:
        df = ak.stock_zh_index_daily(symbol="sh000001")
        if not df.empty:
            print(f"  ✅ 成功获取 {len(df)} 条数据")
            print(f"  最新日期: {df.iloc[-1]['date']}")
        else:
            print(f"  ⚠️  返回空数据")
    except Exception as e:
        print(f"  ❌ 失败: {str(e)[:100]}")
    
    # 市场概况测试
    print("\n[4/6] 市场概况接口...")
    try:
        df = ak.stock_zh_a_spot_em()
        if not df.empty:
            print(f"  ✅ 成功获取 {len(df)} 只股票")
        else:
            print(f"  ⚠️  返回空数据")
    except Exception as e:
        print(f"  ❌ 失败: {str(e)[:100]}")
        # 尝试备用接口
        print(f"  尝试备用接口...")
        try:
            df = ak.stock_zh_a_spot()
            if not df.empty:
                print(f"  ✅ 备用接口成功: {len(df)} 只股票")
        except Exception as e2:
            print(f"  ❌ 备用接口也失败: {str(e2)[:100]}")
    
    # 板块数据测试
    print("\n[5/6] 板块数据接口...")
    try:
        df = ak.stock_board_industry_name_em()
        if not df.empty:
            print(f"  ✅ 成功获取 {len(df)} 个板块")
        else:
            print(f"  ⚠️  返回空数据")
    except Exception as e:
        print(f"  ❌ 失败: {str(e)[:100]}")
    
    # 估值数据测试
    print("\n[6/6] 估值数据接口...")
    try:
        df = ak.index_value_hist_funddb(symbol="沪深300")
        if not df.empty:
            print(f"  ✅ 成功获取 {len(df)} 条数据")
        else:
            print(f"  ⚠️  返回空数据")
    except Exception as e:
        print(f"  ❌ 失败: {str(e)[:100]}")
    
    print("\n" + "=" * 60)
    print("诊断完成")
    print("=" * 60)
    print("\n建议:")
    print("  1. 如果所有接口都失败 → 检查网络连接")
    print("  2. 如果部分接口失败 → 数据源暂时不可用，稍后重试")
    print("  3. 如果 urllib3 版本不是 1.x → 运行: pip3 install 'urllib3<2.0'")
    print("\n详细帮助: 查看 TROUBLESHOOTING.md\n")

if __name__ == "__main__":
    main()
