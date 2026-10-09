# shapes JSON (from tables.py / pad.py ...) -> a js/models file: small integers in base64 (the game turns them back into numbers)
# usage: python3 tojs.py shapes.json out.js name "description"
import json, sys, base64, array
d = json.load(open(sys.argv[1])); out = {}
e = lambda a: base64.b64encode(a.tobytes()).decode()
for k, v in d.items():
    assert max(abs(x) for x in v['pos']) < 2
    out[k] = {'pos': e(array.array('h', [round(x * 16384) for x in v['pos']])), 'nrm': e(array.array('b', [max(-127, min(127, round(x * 127))) for x in v['nrm']])),
              'col': e(array.array('B', [round(x * 255) for x in v['col']])), 'idx': e(array.array('H', v['idx']))}
name = sys.argv[3] if len(sys.argv) > 3 else 'tables'
desc = sys.argv[4] if len(sys.argv) > 4 else "Space-diner tables: 4 types (1, 2, 4, 5 seats) x 5 upgrade levels, key 'seats_level0'."
js = ("/* " + desc + " Made in Blender by code (tools/blender).\n"
      "   One colour per corner, no pictures. pos = int16 / 16384, nrm = int8 / 127, col = uint8; colour (255, 0, 255) = the wing's colour. */\n"
      "(function (TBS) {\n  'use strict';\n  TBS.Models = TBS.Models || {};\n  TBS.Models." + name + " = " + json.dumps(out, separators=(',', ':')) + ";\n})(window.TBS = window.TBS || {});\n")
open(sys.argv[2], 'w').write(js); print('KB', len(js) // 1024)
