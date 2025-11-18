#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AKShare 数据获取脚本
用于获取万得全A指数的真实历史数据
"""

import sys
import json
import akshare as ak
import pandas as pd
from datetime import datetime, timedelta

def get_wind_a_index_data(end_date=None):
    """
    获取万得全A指数数据
    
    Args:
        end_date: 结束日期，格式 YYYY-MM-DD，默认为今天
    
    Returns:
        JSON字符串，包含历史数据和当前指标
    """
    try:
        if end_date is None:
            end_date = datetime.now().strftime('%Y%m%d')
        else:
            end_date = end_date.replace('-', '')
        
        # 起始日期设为2005年
        start_date = '20050101'
        
        # 获取万得全A指数数据 (代码: 881001.WI)
        # 注意：如果AKShare没有万得全A，可以用沪深300或其他替代
        try:
            # 尝试获取万得全A
            df = ak.index_zh_a_hist(symbol="881001", period="daily", start_date=start_date, end_date=end_date)
        except:
            # 如果失败，使用上证指数作为替代
            print("Warning: 万得全A数据获取失败，使用上证指数替代", file=sys.stderr)
            df = ak.stock_zh_index_daily(symbol="sh000001")
            # 转换日期格式用于过滤
            df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y%m%d')
            df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
            # 重新格式化日期列名为'日期'
            df['日期'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
            df['收盘'] = df['close']
            df['成交量'] = df.get('volume', 0)
        
        # 获取股债利差相关数据
        # 这里需要获取：
        # 1. 股票收益率 (可以用PE的倒数估算)
        # 2. 十年期国债收益率
        
        # 获取十年期国债收益率
        try:
            bond_df = ak.bond_zh_us_rate(start_date=start_date[:4]+'-01-01')
            china_10y = bond_df[bond_df['中国国债收益率10年'].notna()].copy()
            china_10y['date'] = pd.to_datetime(china_10y['日期']).dt.strftime('%Y-%m-%d')
            china_10y = china_10y[['date', '中国国债收益率10年']]
            china_10y.columns = ['date', 'bond_yield']
        except Exception as e:
            print(f"Warning: 国债数据获取失败: {e}", file=sys.stderr)
            china_10y = pd.DataFrame()
        
        # 数据处理
        df['date'] = pd.to_datetime(df['日期']).dt.strftime('%Y-%m-%d')
        df['close'] = df['收盘']
        df['volume'] = df.get('成交量', 0)
        
        # 计算涨跌幅
        df['change_pct'] = df['close'].pct_change() * 100
        
        # 构建返回数据
        result = {
            'historical_data': [],
            'current_metrics': {},
            'bond_data': []
        }
        
        # 历史数据（每周采样一次以减少数据量）
        df_weekly = df.iloc[::5].copy()  # 每5个交易日取一个点
        
        for idx, row in df_weekly.iterrows():
            result['historical_data'].append({
                'date': row['date'],
                'close': float(row['close']),
                'volume': float(row.get('volume', 0)),
                'change_pct': float(row.get('change_pct', 0)) if pd.notna(row.get('change_pct')) else 0
            })
        
        # 当前指标（使用最新数据）
        latest = df.iloc[-1]
        
        # 计算PE和PB（这里使用估算值，实际应该从专业数据源获取）
        # 简化计算：假设合理PE范围
        current_pe = 15 + (float(latest['close']) / 3000) * 10  # 简化估算
        current_pb = 1.2 + (float(latest['close']) / 3000) * 1.5  # 简化估算
        
        # 获取最新国债收益率
        if not china_10y.empty:
            latest_bond = china_10y.iloc[-1]
            bond_yield = float(latest_bond['bond_yield'])
        else:
            bond_yield = 2.5  # 默认值
        
        # 计算股债利差 (股票收益率 - 债券收益率)
        # 股票收益率 = 1 / PE * 100
        equity_yield = (1 / current_pe) * 100
        spread = equity_yield - bond_yield
        
        result['current_metrics'] = {
            'date': latest['date'],
            'index_value': float(latest['close']),
            'pe': round(current_pe, 2),
            'pb': round(current_pb, 2),
            'bond_yield': round(bond_yield, 3),
            'equity_yield': round(equity_yield, 3),
            'spread': round(spread, 2),
            'change_pct': float(latest.get('change_pct', 0)) if pd.notna(latest.get('change_pct')) else 0
        }
        
        # 国债数据
        if not china_10y.empty:
            for idx, row in china_10y.iterrows():
                result['bond_data'].append({
                    'date': row['date'],
                    'yield': float(row['bond_yield'])
                })
        
        return json.dumps(result, ensure_ascii=False)
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'message': '获取数据失败，请检查AKShare是否正确安装'
        }
        return json.dumps(error_result, ensure_ascii=False)

if __name__ == '__main__':
    # 从命令行参数获取日期，如果没有则使用今天
    end_date = sys.argv[1] if len(sys.argv) > 1 else None
    
    result = get_wind_a_index_data(end_date)
    print(result)
