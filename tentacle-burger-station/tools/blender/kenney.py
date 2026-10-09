# A Kenney model (kenney.nl, CC0) -> our shape format: each face takes the colour of Kenney's colour-map picture at
# its UV (their models are flat colours from one small picture), so the game needs no picture at all.
# usage: python3 kenney.py model.glb out.json key height [recolour ...]   recolour = "r,g,b>r,g,b" (0-255, nearest match)
import bpy, bmesh, sys, json, math, os
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
src, out, key, height = args[0], args[1], args[2], float(args[3])
recol = []
for r in args[4:]:
    a, b = r.split('>'); recol.append((tuple(int(x) for x in a.split(',')), tuple(int(x) for x in b.split(','))))
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=src)
img = next(i for i in bpy.data.images if i.size[0] > 0)
W, H = img.size; px = list(img.pixels)
def sample(u, v):
    x = min(W - 1, max(0, int(u % 1 * W))); y = min(H - 1, max(0, int(v % 1 * H)))  # Blender keeps v up
    i = (y * W + x) * 4; c = [px[i], px[i + 1], px[i + 2]]
    c = [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c]  # picture colours are sRGB: game colours here are linear-ish? keep sRGB
    return c
pos, nrm, col, idx, seen = [], [], [], [], {}
dg = bpy.context.evaluated_depsgraph_get()
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
allv = []
for o in meshes:
    me = o.evaluated_get(dg).to_mesh(); me.transform(o.matrix_world)
    allv += [v.co.copy() for v in me.vertices]
    o.evaluated_get(dg).to_mesh_clear()
zmin = min(v.z for v in allv); zmax = max(v.z for v in allv); s = height / (zmax - zmin)
cx = (min(v.x for v in allv) + max(v.x for v in allv)) / 2; cy = (min(v.y for v in allv) + max(v.y for v in allv)) / 2
for o in meshes:
    ev = o.evaluated_get(dg); me = ev.to_mesh(); me.transform(o.matrix_world)
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.triangulate(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
    uvl = me.uv_layers.active.data; cn = me.corner_normals
    for p in me.polygons:
        u = sum(uvl[li].uv.x for li in p.loop_indices) / 3; v = sum(uvl[li].uv.y for li in p.loop_indices) / 3
        r, g, b = [round(min(1, max(0, c)) ** (1 / 2.2) * 255) for c in sample(u, v)]
        for a, bb in recol:
            if abs(r - a[0]) + abs(g - a[1]) + abs(b - a[2]) < 40: r, g, b = bb; break
        c = (r / 255, g / 255, b / 255)
        for li in p.loop_indices:
            vv = me.vertices[me.loops[li].vertex_index].co; n = cn[li].vector
            k = (round(vv.x, 4), round(vv.y, 4), round(vv.z, 4), round(n.x, 2), round(n.y, 2), round(n.z, 2), c)
            j = seen.get(k)
            if j is None:
                j = len(pos) // 3; seen[k] = j
                pos += [(vv.x - cx) * s, (vv.z - zmin) * s, -(vv.y - cy) * s]; nrm += [n.x, n.z, -n.y]; col += list(c)
            idx.append(j)
    ev.to_mesh_clear()
data = json.load(open(out)) if os.path.exists(out) else {}
data[key] = {'pos': [round(x, 4) for x in pos], 'nrm': [round(x, 3) for x in nrm], 'col': [round(x, 3) for x in col], 'idx': idx}
json.dump(data, open(out, 'w'))
print(key, 'tris', len(idx) // 3, 'colours', sorted(set(tuple(round(x * 255) for x in col[i:i + 3]) for i in range(0, len(col), 3))))
