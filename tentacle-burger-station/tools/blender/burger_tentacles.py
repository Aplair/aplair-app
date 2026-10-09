# Adds little purple tentacles curling out of the patty of a burger shape (made by kenney.py) -> new key.
# usage: python3 burger_tentacles.py food.json from_key new_key
import math, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artlib import *
src, a, b = sys.argv[-3], sys.argv[-2], sys.argv[-1]
PURPLE, SUCK = hx(0x8f45d6), hx(0xf2b6e6)
clear()
Y, R = 0.09, 0.2  # patty height and where the tentacles leave it
for ang, L, up in [(0.5, 0.17, 0.10), (2.6, 0.15, 0.08), (4.5, 0.16, 0.12)]:
    dx, dz = math.sin(ang), math.cos(ang); sx, sz = math.cos(ang), -math.sin(ang)  # out and sideways
    pts, rad = [], []
    for k in range(6):  # out, then curling up and a little sideways
        t = k / 5
        pts.append((dx * (R + L * t) + sx * 0.04 * t * t, Y + up * t * t, dz * (R + L * t) + sz * 0.04 * t * t)); rad.append(0.045 * (1 - t) + 0.008)
    tube(pts, rad, col=PURPLE, sides=6)
    for t in (0.35, 0.65):  # two suckers on top
        k = t * 5; i = int(k); f = k - i
        p = [pts[i][j] * (1 - f) + pts[i + 1][j] * f for j in range(3)]
        r = rad[i] * (1 - f) + rad[i + 1] * f
        sph(r * 0.45, p[0], p[1] + r * 0.8, p[2], col=SUCK, seg=6, rings=4)
extra = export()
d = json.load(open(src)); base = d[a]; n0 = len(base['pos']) // 3
d[b] = {'pos': base['pos'] + extra['pos'], 'nrm': base['nrm'] + extra['nrm'], 'col': base['col'] + extra['col'], 'idx': base['idx'] + [i + n0 for i in extra['idx']]}
json.dump(d, open(src, 'w'))
print(b, 'tris', len(d[b]['idx']) // 3)
