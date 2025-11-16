#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试 AKShare 安装和基本功能
"""

import sys

def test_akshare():
    """测试 AKShare 是否正确安装"""
    
    print("=" * 50)
    print("AKShare 安装测试")
    print("=" * 50)
    
    # 1. 测试导入
    print("\n[1/4] 测试导入 akshare...")
    try:
        import akshare as ak
        print("✅ 成功导入 akshare")
        print(f"   版本: {ak.__version__}")
    except ImportError as e:
        print(f"❌ 导入失败: {e}")
        print("\n请运行以下命令安装:")
        print("  pip3 install akshare")
        sys.exit(1)
    
    # 2. 测试 pandas
    print("\n[2/4] 测试导入 pandas...")
    try:
        import pandas as pd
        print("✅ 成功导入 pandas")
        print(f"   版本: {pd.__version__}")
    except ImportError as e:
        print(f"❌ 导入失败: {e}")
        print("\n请运行以下命令安装:")
        print("  pip3 install pandas")
        sys.exit(1)
    
    # 3. 测试获取指数数据
    print("\n[3/4] 测试获取指数数据...")
    try:
        df = ak.stock_zh_index_daily(symbol="sh000001")
        if not df.empty:
            print("✅ 成功获取上证指数数据")
            print(f"   数据行数: {len(df)}")
            print(f"   最新日期: {df.iloc[-1]['date']}")
        else:
            print("⚠️  获取到空数据")
    except Exception as e:
        print(f"❌ 获取数据失败: {e}")
        print("\n可能的原因:")
        print("  1. 网络连接问题")
        print("  2. AKShare 版本过旧，请升级: pip3 install --upgrade akshare")
    
    # 4. 测试获取板块数据
    print("\n[4/4] 测试获取板块数据...")
    try:
        df = ak.stock_board_industry_name_em()
        if not df.empty:
            print("✅ 成功获取板块列表")
            print(f"   板块数量: {len(df)}")
        else:
            print("⚠️  获取到空数据")
    except Exception as e:
        print(f"❌ 获取数据失败: {e}")
    
    print("\n" + "=" * 50)
    print("测试完成！")
    print("=" * 50)
    print("\n如果所有测试都通过，说明 AKShare 已正确安装。")
    print("现在可以运行: npm run server")
    print()

if __name__ == "__main__":
    test_akshare()
