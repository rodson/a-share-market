import sys
import os

# 将当前脚本所在目录添加到 sys.path，确保能正确引入同目录下的 WindPy
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from WindPy import w

res = w.start()
print(f"Start result: {res}")

if res.ErrorCode != 0:
    print("Wind API 启动失败，请检查 Wind 终端是否运行并登录，或账号是否有 Python API 权限。")
else:
    data = w.wsd("000001.SZ", "close", "20241101", "20241129", "")
    print(data)