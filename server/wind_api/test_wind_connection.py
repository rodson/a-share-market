#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Wind API连接测试脚本
用于验证Wind终端是否正常连接
"""

import sys

def test_wind_connection():
    """测试Wind API连接"""
    print("=" * 60)
    print("Wind API 连接测试")
    print("=" * 60)
    
    # 1. 检查WindPy是否已安装
    print("\n[1/4] 检查WindPy模块...")
    try:
        from WindPy import w
        print("✓ WindPy模块已安装")
    except ImportError as e:
        print(f"✗ WindPy模块未安装: {e}")
        print("\n请使用以下命令安装:")
        print("  pip install WindPy")
        return False
    
    # 2. 启动Wind API
    print("\n[2/4] 启动Wind API...")
    try:
        w.start()
        print("✓ Wind API启动成功")
    except Exception as e:
        print(f"✗ Wind API启动失败: {e}")
        return False
    
    # 3. 检查连接状态
    print("\n[3/4] 检查Wind终端连接状态...")
    if w.isconnected():
        print("✓ Wind终端已连接")
    else:
        print("✗ Wind终端未连接")
        print("\n请确保:")
        print("  1. Wind金融终端已安装")
        print("  2. Wind终端已启动")
        print("  3. Wind终端已登录账号")
        w.stop()
        return False
    
    # 4. 测试数据获取
    print("\n[4/4] 测试数据获取...")
    try:
        # 获取上证指数最近一天的数据
        data = w.wsd("000001.SH", "close,pct_chg", "2024-01-02", "2024-01-02", "")
        
        if data.ErrorCode != 0:
            print(f"✗ 数据获取失败: {data.ErrorMsg}")
            w.stop()
            return False
        else:
            print("✓ 数据获取成功")
            print(f"\n示例数据 (上证指数 2024-01-02):")
            print(f"  收盘价: {data.Data[0][0] if data.Data and data.Data[0] else 'N/A'}")
            print(f"  涨跌幅: {data.Data[1][0] if data.Data and len(data.Data) > 1 else 'N/A'}%")
    except Exception as e:
        print(f"✗ 数据获取失败: {e}")
        w.stop()
        return False
    
    # 5. 关闭Wind API
    w.stop()
    
    print("\n" + "=" * 60)
    print("✓ 所有测试通过! Wind API已就绪")
    print("=" * 60)
    return True

def test_api_scripts():
    """测试各个API脚本"""
    print("\n\n" + "=" * 60)
    print("API脚本测试")
    print("=" * 60)
    
    import subprocess
    import os
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_date = "2024-01-02"
    
    scripts = [
        {
            "name": "指数数据",
            "script": "get_indices.py",
            "args": ["000001.SH,399001.SZ", test_date]
        },
        {
            "name": "市场概况",
            "script": "get_market_overview.py",
            "args": [test_date]
        },
        {
            "name": "股债利差",
            "script": "get_equity_bond_spread.py",
            "args": [test_date]
        }
    ]
    
    for script_info in scripts:
        print(f"\n测试 {script_info['name']} ({script_info['script']})...")
        script_path = os.path.join(script_dir, script_info['script'])
        
        try:
            result = subprocess.run(
                ['python', script_path] + script_info['args'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✓ {script_info['name']}测试成功")
                # 只显示前200个字符
                output = result.stdout[:200]
                print(f"  输出预览: {output}...")
            else:
                print(f"✗ {script_info['name']}测试失败")
                print(f"  错误: {result.stderr}")
        except subprocess.TimeoutExpired:
            print(f"✗ {script_info['name']}测试超时")
        except Exception as e:
            print(f"✗ {script_info['name']}测试失败: {e}")

if __name__ == "__main__":
    print("\n开始Wind API测试...\n")
    
    # 基础连接测试
    if test_wind_connection():
        # 如果基础测试通过，继续测试各个API脚本
        test_api_scripts()
    else:
        print("\n基础连接测试失败，请先解决连接问题")
        sys.exit(1)
    
    print("\n测试完成!\n")
