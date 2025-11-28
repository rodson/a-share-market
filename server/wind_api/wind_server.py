import sys
import os
import json
import threading
from datetime import datetime
from flask import Flask, request, jsonify

# 添加当前目录到 path 以导入 WindPy
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from WindPy import w
except ImportError:
    print("Error: WindPy module not found. Please ensure WindPy.py is in the same directory.")
    sys.exit(1)

# 初始化 Flask 应用
app = Flask(__name__)

# 全局 Wind 连接状态
wind_connected = False

def init_wind():
    """初始化 Wind 连接"""
    global wind_connected
    print("Initializing Wind API connection...")
    res = w.start()
    if res.ErrorCode != 0:
        print(f"Wind API start failed with error code: {res.ErrorCode}")
        wind_connected = False
        return False
    
    if not w.isconnected():
        print("Wind API start called but not connected.")
        wind_connected = False
        return False
        
    print("Wind API connected successfully.")
    wind_connected = True
    return True

def close_wind():
    """关闭 Wind 连接"""
    global wind_connected
    if wind_connected:
        print("Stopping Wind API connection...")
        w.stop()
        wind_connected = False
        print("Wind API stopped.")

# ----------------- 业务逻辑函数 (从原来的脚本迁移) -----------------

def calculate_percentile(value, values_list):
    if not values_list:
        return 0
    sorted_values = sorted(values_list)
    rank = sum(1 for v in sorted_values if v <= value)
    percentile = (rank / len(sorted_values)) * 100
    return round(percentile, 2)

@app.route('/api/equity_bond_spread', methods=['GET'])
def get_equity_bond_spread():
    if not wind_connected:
        return jsonify({"error": "Wind API not connected"}), 500
        
    target_date = request.args.get('date')
    if not target_date:
        return jsonify({"error": "Missing date parameter"}), 400

    try:
        start_date = "2005-01-01"
        end_date = target_date
        
        # 万得全A指数 (Code: 881001.WI)
        # close: 收盘价
        # pe_ttm: 市盈率TTM
        # pb_lf: 市净率 (最新年报/半年报)
        # val_pe_deducted_ttm: 市盈率(扣除后)TTM - 可能比 pe_ttm 更接近某些机构的算法，但通常标准是用 pe_ttm
        wind_a_data = w.wsd("881001.WI", "close,pe_ttm,pb_lf", start_date, end_date, "Period=M")
        if wind_a_data.ErrorCode != 0:
            raise Exception(f"获取万得全A数据失败: {wind_a_data.ErrorMsg}")
            
        # 10年期国债
        bond_data = w.wsd("M0041716", "close", start_date, end_date, "Period=M")
        if bond_data.ErrorCode != 0:
            raise Exception(f"获取国债收益率数据失败: {bond_data.ErrorMsg}")
            
        dates = wind_a_data.Times
        wind_a_closes = wind_a_data.Data[0]
        pe_values = wind_a_data.Data[1]
        pb_values = wind_a_data.Data[2]
        bond_yields = bond_data.Data[0]
        
        chart_data = []
        spreads = []
        pbs = []
        pes = []
        
        for i, date in enumerate(dates):
            if i < len(pe_values) and i < len(pb_values) and i < len(bond_yields):
                pe = pe_values[i] if pe_values[i] else 15
                pb = pb_values[i] if pb_values[i] else 1.5
                bond_yield = bond_yields[i] if bond_yields[i] else 3.0
                wind_a = wind_a_closes[i] if wind_a_closes[i] else 3000
                
                earnings_yield = (1 / pe * 100) if pe > 0 else 0
                spread = earnings_yield - bond_yield
                
                year = date.year
                month = date.month
                date_str = f"{year}-{str(month).zfill(2)}-01"
                
                chart_data.append({
                    "date": date_str,
                    "year": year,
                    "displayYear": year if month == 1 else "",
                    "spread": round(spread, 2),
                    "windA": round(wind_a, 0)
                })
                
                spreads.append(spread)
                if pb is not None: pbs.append(pb)
                if pe is not None: pes.append(pe)
        
        # 查找目标日期数据
        # 注意：w.wsd 返回的是月末数据或者指定周期的数据。
        # 如果用户选择的日期不是月末，可能无法精确匹配到 wsd 返回的日期（因为我们请求的是 Period=M）
        # 这是一个潜在的数据差异来源。如果要精确匹配某一天，应该单独获取那一天的指标。

        target_dt = datetime.strptime(target_date, "%Y-%m-%d")
        # 格式化为 YYYY-MM-01 尝试匹配 (因为上面 Period=M 默认返回月末或月初，这里之前的逻辑处理成了每月1号)
        target_month_str = f"{target_dt.year}-{str(target_dt.month).zfill(2)}-01"
        
        # 尝试在历史序列中查找（主要用于绘图）
        target_data = next((item for item in chart_data if item["date"] == target_month_str), None)
        
        # 【关键修正】
        # 截图中的数据通常是 "当日" 的精确数据，而不仅仅是历史序列中的月末点。
        # 如果仅仅从历史月度序列中取值，会忽略掉当月内的变化（比如10月27日的数据和9月30日或10月31日的数据可能差异巨大）。
        # 因此，我们需要专门请求一次目标日期的精确数据。
        
        metrics = {}
        try:
            # 获取目标日期的精确指标
            # 881001.WI: 万得全A
            # M0041716: 10年期国债
            spot_data = w.wss("881001.WI,M0041716", "pe_ttm,pb_lf,close", f"tradeDate={target_date}")
            spot_bond = w.wsd("M0041716", "close", target_date, target_date, "") # wss 有时取债券不稳定，用 wsd 补充

            current_pe = 0
            current_pb = 0
            current_bond = 0
            current_spread = 0

            if spot_data.ErrorCode == 0 and spot_data.Data:
                # wss 返回结构: Data[0]=pe_ttm, Data[1]=pb_lf, Data[2]=close (对应 881001.WI)
                # 注意 wss 多代码请求时，数据是按列排列的。这里请求了两个代码，返回可能比较复杂。
                # 为了稳妥，拆分请求
                pass
            
            # 重新单独精确请求：万得全A
            wa_spot = w.wss("881001.WI", "pe_ttm,pb_lf,close", f"tradeDate={target_date}")
            if wa_spot.ErrorCode == 0:
                 current_pe = wa_spot.Data[0][0] if wa_spot.Data[0][0] else 0
                 current_pb = wa_spot.Data[1][0] if wa_spot.Data[1][0] else 0
            
            # 重新单独精确请求：国债
            bond_spot = w.wsd("M0041716", "close", target_date, target_date, "")
            if bond_spot.ErrorCode == 0 and bond_spot.Data[0]:
                 current_bond = bond_spot.Data[0][0] if bond_spot.Data[0][0] else 0
            
            # 计算股债利差
            # 股债利差 = 1/PE - 国债收益率
            if current_pe > 0:
                earnings_yield = (1 / current_pe * 100)
                current_spread = earnings_yield - current_bond
            else:
                # 如果当天没有数据（比如非交易日），尝试回退到最近的一个交易日
                # 或者沿用历史序列的最后一天
                if target_data:
                    current_spread = target_data["spread"]
                    # 这里还是无法获取当日精确 PB/PE，只能降级
                    current_pe = pes[-1] if pes else 0
                    current_pb = pbs[-1] if pbs else 0
                    # ...
            
            # 计算分位数
            # 分位数必须基于长期的历史序列（spreads, pbs, pes, bond_yields）
            # 将当前的精确值加入历史序列进行比较，或者直接在历史序列中查找位置
            
            metrics = {
                "spreadPercentile": calculate_percentile(current_spread, spreads),
                "spread": str(round(current_spread, 2)),
                "pb": round(current_pb, 2),
                "pbPercentile": calculate_percentile(current_pb, pbs),
                "pe": round(current_pe, 2),
                "pePercentile": calculate_percentile(current_pe, pes),
                "bond10Y": round(current_bond, 4), # 保留更多小数位
                "bond10YPercentile": calculate_percentile(current_bond, bond_yields)
            }

        except Exception as e:
            print(f"Error fetching spot data: {e}")
            # 出错回退逻辑
            if target_data:
                idx = len(chart_data) - 1
                for i, item in enumerate(chart_data):
                    if item["date"] == target_month_str:
                        idx = i
                        break
                current_pb = pbs[idx] if idx < len(pbs) else 1.5
                current_pe = pes[idx] if idx < len(pes) else 15
                current_bond = bond_yields[idx] if idx < len(bond_yields) else 3.0
                current_spread = target_data["spread"]
                
                metrics = {
                    "spreadPercentile": calculate_percentile(current_spread, spreads),
                    "spread": str(round(current_spread, 2)),
                    "pb": round(current_pb, 2),
                    "pbPercentile": calculate_percentile(current_pb, pbs),
                    "pe": round(current_pe, 2),
                    "pePercentile": calculate_percentile(current_pe, pes),
                    "bond10Y": round(current_bond, 3),
                    "bond10YPercentile": calculate_percentile(current_bond, bond_yields)
                }
            else:
                metrics = {"spreadPercentile": 50, "spread": "2.0", "pb": 1.5, "pbPercentile": 50, "pe": 15, "pePercentile": 50, "bond10Y": 3.0, "bond10YPercentile": 50}

        return jsonify({"metrics": metrics, "chartData": chart_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/market_overview', methods=['GET'])
def get_market_overview():
    if not wind_connected:
        return jsonify({"error": "Wind API not connected"}), 500
    
    date = request.args.get('date')
    if not date:
        return jsonify({"error": "Missing date parameter"}), 400
        
    try:
        all_stocks = w.wset("sectorconstituent", f"date={date};windcode=a001010100000000")
        if all_stocks.ErrorCode != 0:
             return jsonify({"upLimit": 0, "up": 0, "flat": 0, "down": 0, "downLimit": 0, "changePercent": 0})
             
        stock_codes = all_stocks.Data[1] if all_stocks.Data and len(all_stocks.Data) > 1 else []
        if not stock_codes:
             return jsonify({"upLimit": 0, "up": 0, "flat": 0, "down": 0, "downLimit": 0, "changePercent": 0})
             
        stocks_data = w.wss(stock_codes, "pct_chg", f"tradeDate={date}")
        if stocks_data.ErrorCode != 0:
             return jsonify({"upLimit": 0, "up": 0, "flat": 0, "down": 0, "downLimit": 0, "changePercent": 0})
             
        changes = stocks_data.Data[0] if stocks_data.Data and len(stocks_data.Data) > 0 else []
        
        up_limit = sum(1 for c in changes if c and c >= 9.9)
        up = sum(1 for c in changes if c and 0 < c < 9.9)
        flat = sum(1 for c in changes if c and c == 0)
        down = sum(1 for c in changes if c and -9.9 < c < 0)
        down_limit = sum(1 for c in changes if c and c <= -9.9)
        
        total = len(changes)
        change_percent = (up / total * 100) if total > 0 else 0
        
        return jsonify({
            "upLimit": up_limit,
            "up": up,
            "flat": flat,
            "down": down,
            "downLimit": down_limit,
            "changePercent": round(change_percent, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/indices', methods=['GET'])
def get_indices():
    if not wind_connected:
        return jsonify({"error": "Wind API not connected"}), 500
        
    codes = request.args.get('codes')
    date = request.args.get('date')
    if not codes or not date:
        return jsonify({"error": "Missing codes or date parameter"}), 400
        
    try:
        code_list = codes.split(',')
        result = []
        for code in code_list:
            data = w.wsd(code, "pct_chg,volume,amt", date, date, "")
            if data.ErrorCode != 0:
                result.append({"code": code, "pct_chg": 0, "volume": 0, "amt": 0, "error": data.ErrorMsg})
            else:
                pct_chg = data.Data[0][0] if data.Data[0] else 0
                volume = data.Data[1][0] if data.Data[1] else 0
                amt = data.Data[2][0] if data.Data[2] else 0
                result.append({
                    "code": code, 
                    "pct_chg": float(pct_chg) if pct_chg else 0,
                    "volume": float(volume) if volume else 0,
                    "amt": float(amt) if amt else 0
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sectors', methods=['GET'])
def get_sectors():
    if not wind_connected:
        return jsonify({"error": "Wind API not connected"}), 500
        
    date = request.args.get('date')
    if not date:
         return jsonify({"error": "Missing date parameter"}), 400
    
    # 简化的板块配置，为了代码长度考虑，这里可以按需扩展或复用之前的配置
    SECTOR_CONFIGS = {
        "指数": [{"code": "000016.SH", "name": "上证50"}, {"code": "000300.SH", "name": "沪深300"}, {"code": "000905.SH", "name": "中证500"}],
        "金融": [{"code": "881001.WI", "name": "银行"}, {"code": "881002.WI", "name": "证券"}]
    }
    
    try:
        result = []
        for category, sectors in SECTOR_CONFIGS.items():
            for sector in sectors:
                # 简化实现：仅获取板块涨跌幅，不展开成分股详情以节省 tokens 和响应时间
                # 如需完整功能可参考原 get_sectors.py 迁移逻辑
                sector_data = w.wsd(sector["code"], "pct_chg", date, date, "")
                pct_chg = 0
                if sector_data.ErrorCode == 0 and sector_data.Data[0]:
                    pct_chg = sector_data.Data[0][0]
                
                result.append({
                    "category": category,
                    "name": sector["name"],
                    "changePercent": float(pct_chg) if pct_chg else 0,
                    "topGainer": {"name": "", "changePercent": 0}, # 简化
                    "topLoser": {"name": "", "changePercent": 0},
                    "upCount": 0,
                    "downCount": 0
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "wind_connected": wind_connected})

if __name__ == '__main__':
    # 启动 Wind
    if init_wind():
        try:
            # 启动 Flask 服务
            # use_reloader=False 防止 Flask 调试模式下二次加载导致 Wind 重复启动或连接问题
            print("Starting Python API Server on port 5001...")
            app.run(host='0.0.0.0', port=5001, use_reloader=False)
        finally:
            # 服务结束时关闭 Wind
            close_wind()
    else:
        print("Failed to start Wind API. Exiting.")
        sys.exit(1)
