#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试 V3 版本的性能
"""

import time
import subprocess
import json

def test_version(script_name, date):
    """测试指定版本的性能"""
    start_time = time.time()
    
    try:
        result = subprocess.run(
            ['python3', script_name, date],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        elapsed = time.time() - start_time
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            return {
                'success': True,
                'elapsed': elapsed,
                'data': data
            }
        else:
            return {
                'success': False,
                'elapsed': elapsed,
                'error': result.stderr
            }
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'elapsed': 10.0,
            'error': '超时（10秒）'
        }
    except Exception as e:
        return {
            'success': False,
            'elapsed': time.time() - start_time,
            'error': str(e)
        }

if __name__ == '__main__':
    date = '2025-11-16'
    
    print("=" * 60)
    print("性能测试对比")
    print("=" * 60)
    
    versions = [
        ('get_market_overview_v2.py', 'V2 版本'),
        ('get_market_overview_v3.py', 'V3 版本（终极优化）'),
    ]
    
    for script, name in versions:
        print(f"\n测试 {name}...")
        result = test_version(script, date)
        
        if result['success']:
            print(f"  ✅ 成功")
            print(f"  ⏱️  耗时: {result['elapsed']:.2f} 秒")
            print(f"  📊 数据: {result['data']}")
        else:
            print(f"  ❌ 失败")
            print(f"  ⏱️  耗时: {result['elapsed']:.2f} 秒")
            print(f"  ⚠️  错误: {result['error']}")
    
    print("\n" + "=" * 60)
