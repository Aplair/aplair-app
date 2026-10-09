# Shared helpers for the Blender art scripts: simple shapes in GAME axes (x, y up, z toward the hall), colour per part,
# export to positions / normals / colours / indices. Colour (1, 0, 1) = the wing colour marker.
import bpy, bmesh, math

ACCENT = (1.0, 0.0, 1.0)
def hx(h): return (((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255)
METAL_D, METAL, METAL_L = hx(0x3c4358), hx(0x8a93a6), hx(0xc9d0dc)
WHITE, GLOW, GOLD, NAVY, SAND, SAND_D = hx(0xf2f5fa), hx(0x52f2ff), hx(0xffcf3a), hx(0x262d63), hx(0xffd9a8), hx(0xe9a86c)

parts = []  # (object, colour)
def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
    parts.clear()

# game coords (x, y up, z) -> blender (x, -z, y)
def B(x, y, z): return (x, -z, y)

def cyl(r1, r2, h, x, y, z, seg=16, col=METAL, bevel=0.0, rot=None):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r1, radius2=r2, depth=h, location=B(x, y + h / 2, z))
    o = bpy.context.object
    if rot: o.rotation_euler = rot
    if bevel: bev(o, bevel)
    parts.append((o, col)); return o

def box(w, h, d, x, y, z, col=METAL, bevel=0.0, rz=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=B(x, y + h / 2, z))
    o = bpy.context.object; o.scale = (w, d, h); o.rotation_euler = (0, 0, rz)
    bpy.ops.object.transform_apply(scale=True)
    if bevel: bev(o, bevel)
    parts.append((o, col)); return o

def sph(r, x, y, z, col=METAL, seg=12, rings=8, sy=1.0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=B(x, y, z))
    o = bpy.context.object; o.scale = (1, 1, sy)
    parts.append((o, col)); return o

def torus(R, r, x, y, z, col=GLOW, seg=24, mseg=6):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=mseg, location=B(x, y, z))
    o = bpy.context.object; parts.append((o, col)); return o

def bev(o, w):
    m = o.modifiers.new('b', 'BEVEL'); m.width = w; m.segments = 1; m.limit_method = 'ANGLE'

def star(x, y, z, size, col=GOLD, rz=0.0):  # flat 5-point star, a little thick
    bm = bmesh.new(); pts = []
    for i in range(10):
        a = rz + i * math.pi / 5; rr = size if i % 2 == 0 else size * 0.45
        pts.append((x + math.sin(a) * rr, z + math.cos(a) * rr))
    top = [bm.verts.new(B(px, y + 0.012, pz)) for px, pz in pts]
    bot = [bm.verts.new(B(px, y, pz)) for px, pz in pts]
    ct, cb = bm.verts.new(B(x, y + 0.012, z)), bm.verts.new(B(x, y, z))
    for i in range(10):
        j = (i + 1) % 10
        bm.faces.new((ct, top[i], top[j])); bm.faces.new((cb, bot[j], bot[i])); bm.faces.new((top[i], bot[i], bot[j], top[j]))
    me = bpy.data.meshes.new('star'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('star', me); bpy.context.collection.objects.link(o); parts.append((o, col)); return o

def export():
    pos, nrm, col, idx, seen = [], [], [], [], {}
    dg = bpy.context.evaluated_depsgraph_get()
    for o, c in parts:
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        me.transform(o.matrix_world)
        bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.triangulate(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
        # smooth inside a part, sharp across edges sharper than 40 degrees
        for p in me.polygons: p.use_smooth = True
        try: me.set_sharp_from_angle(angle=math.radians(40))
        except Exception: pass
        cn = me.corner_normals
        for p in me.polygons:
            for li in p.loop_indices:
                v = me.vertices[me.loops[li].vertex_index].co; n = cn[li].vector
                key = (round(v.x, 4), round(v.y, 4), round(v.z, 4), round(n.x, 2), round(n.y, 2), round(n.z, 2), c)
                k = seen.get(key)
                if k is None:
                    k = len(pos) // 3; seen[key] = k
                    pos += [v.x, v.z, -v.y]; nrm += [n.x, n.z, -n.y]; col += list(c)
                idx.append(k)
        ev.to_mesh_clear()
    return {'pos': [round(x, 4) for x in pos], 'nrm': [round(x, 3) for x in nrm], 'col': [round(x, 3) for x in col], 'idx': idx}

