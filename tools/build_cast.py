"""Assemble the Artesian Water cast from the CC0 Quaternius packs into one GLB per character.

    blender -b --factory-startup -P tools/build_cast.py -- assets/quaternius assets/cast

Each character = an outfit's body parts (Regular proportions, its own humanoid skeleton) + the head of a Universal
Base Character (cut at the neck; the skeletons match within 2 cm) + hair / beard / eyebrows rigged to the head bone.
Every mesh gets a flat material named for its ROLE (skin, shirt, trousers, boots, hair, eyes, ...); the page
recolours by role at runtime, so one GLB serves several people. No textures are exported: the pencil shader draws
from flat local colour, light and form.
"""
import bpy, os, sys, bmesh

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
os.makedirs(OUT, exist_ok=True)
BASE = os.path.join(SRC, 'Universal Base Characters[Standard]')
OUTF = os.path.join(SRC, 'Modular Character Outfits - Fantasy[Standard]', 'Exports', 'glTF (Godot-Unreal)')
HAIR = os.path.join(BASE, 'Hairstyles', 'Rigged to Head Bone', 'glTF (Godot -Unreal)')

# character: outfit file (whole outfit) + parts to keep, base head, hair pieces
CAST = {
    'man':      dict(outfit='Outfits/Male_Peasant.gltf',   keep=None, head='Superhero_Male_FullBody.gltf',   hair=['Hair_SimpleParted', 'Eyebrows_Regular']),
    'man_beard': dict(outfit='Outfits/Male_Peasant.gltf',  keep=None, head='Superhero_Male_FullBody.gltf',   hair=['Hair_Buzzed', 'Hair_Beard', 'Eyebrows_Regular']),
    'man_ranger': dict(outfit='Outfits/Male_Ranger.gltf',  keep=('Arms', 'Body', 'Legs', 'Feet'), head='Superhero_Male_FullBody.gltf', hair=['Hair_SimpleParted', 'Hair_Beard', 'Eyebrows_Regular']),
    'woman':    dict(outfit='Outfits/Female_Peasant.gltf', keep=None, head='Superhero_Female_FullBody.gltf', hair=['Hair_Buns', 'Eyebrows_Female']),
    'woman_trousers': dict(outfit='Outfits/Female_Ranger.gltf', keep=('Arms', 'Body', 'Legs', 'Feet'), head='Superhero_Female_FullBody.gltf', hair=['Hair_Buns', 'Eyebrows_Female']),
}
NECK_Z = 1.47   # metres: keep the base body's head and neck above this height


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def imp(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


def role_of(obj, mat_name):
    n = (obj.name + ' ' + (mat_name or '')).lower()
    if 'eye' in n and 'brow' not in n:
        return 'eyes'
    if 'brow' in n:
        return 'brows'
    if 'beard' in n:
        return 'beard'
    if 'hair' in n or 'buns' in n or 'buzzed' in n or 'parted' in n:
        return 'hair'
    if 'regular' in n or 'superhero' in n or 'skin' in n:
        return 'skin'
    if 'arms' in n or 'body' in n or 'bracer' in n or 'belt' in n:
        return 'shirt' if 'belt' not in n else 'belt'
    if 'legs' in n:
        return 'trousers'
    if 'feet' in n or 'boot' in n:
        return 'boots'
    return 'cloth'


MATS = {}


def mat(role):
    if role not in MATS:
        m = bpy.data.materials.new(role)
        m.use_nodes = True
        b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value = (.6, .6, .6, 1)
        b.inputs['Roughness'].default_value = 1
        MATS[role] = m
    return MATS[role]


def build(name, spec):
    reset()
    MATS.clear()
    objs = imp(os.path.join(OUTF, spec['outfit']))
    arm = next(o for o in objs if o.type == 'ARMATURE')
    arm.name = 'Rig'
    for o in objs:
        if o.type == 'MESH' and spec['keep'] and not any(k in o.name for k in spec['keep']):
            bpy.data.objects.remove(o)
    # base character: keep only the head / neck of the body mesh, plus eyes; retarget to the outfit skeleton
    bobjs = imp(os.path.join(BASE, 'Base Characters', 'Godot - UE', spec['head']))
    barm = next(o for o in bobjs if o.type == 'ARMATURE')
    for o in bobjs:
        if o.type != 'MESH':
            continue
        is_body = len(o.data.vertices) > 3000
        if is_body:
            bm = bmesh.new(); bm.from_mesh(o.data)
            mw = o.matrix_world
            def keep(v):
                w = mw @ v.co
                return w.z > 1.545 or (w.z > NECK_Z and abs(w.x) < .075 and abs(w.y + .03) < .085)
            kill = [v for v in bm.verts if not keep(v)]
            bmesh.ops.delete(bm, geom=kill, context='VERTS')
            bm.to_mesh(o.data); bm.free()
            o.name = 'Head_skin'
        for m in o.modifiers:
            if m.type == 'ARMATURE':
                m.object = arm
        o.parent = arm
        o.matrix_parent_inverse = arm.matrix_world.inverted()
    bpy.data.objects.remove(barm)
    for h in spec['hair']:
        hobjs = imp(os.path.join(HAIR, h + '.gltf'))
        harm = next((o for o in hobjs if o.type == 'ARMATURE'), None)
        for o in hobjs:
            if o.type == 'MESH':
                o.name = h
                for m in o.modifiers:
                    if m.type == 'ARMATURE':
                        m.object = arm
                o.parent = arm
                o.matrix_parent_inverse = arm.matrix_world.inverted()
        if harm:
            bpy.data.objects.remove(harm)
    # hands: any arm face weighted mostly to a hand/finger bone is skin (some outfits paint hands into the sleeve atlas)
    HANDB = ('hand_', 'index_', 'middle_', 'ring_', 'pinky_', 'thumb_')
    for o in [o for o in bpy.data.objects if o.type == 'MESH' and 'Arms' in o.name and 'Bracer' not in o.name]:
        names = [s.material.name if s.material else '' for s in o.material_slots]
        if any('Regular' in n or 'Superhero' in n for n in names):
            continue
        gname = {g.index: g.name for g in o.vertex_groups}
        o.data.materials.append(bpy.data.materials.new('MI_Regular_skin'))
        si = len(o.material_slots) - 1
        for poly in o.data.polygons:
            hand = 0
            for vi in poly.vertices:
                gs = o.data.vertices[vi].groups
                if gs:
                    top = max(gs, key=lambda g: g.weight)
                    hand += gname.get(top.group, '').startswith(HANDB)
            if hand * 2 > len(poly.vertices):
                poly.material_index = si
    # flat role materials (split multi-material meshes by their original material names)
    for o in [o for o in bpy.data.objects if o.type == 'MESH']:
        names = [s.material.name if s.material else '' for s in o.material_slots]
        for i, s in enumerate(o.material_slots):
            s.material = mat(role_of(o, names[i]))
    for o in [o for o in bpy.data.objects if o.type not in ('MESH', 'ARMATURE')]:
        bpy.data.objects.remove(o)
    # drop helper spheres that ship in the packs (no material), and the base body's own brows (the hair set has them)
    for o in [o for o in bpy.data.objects if o.type == 'MESH' and (not o.material_slots or o.name == 'Eyebrows')]:
        bpy.data.objects.remove(o)
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)
    path = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_animations=False, export_materials='EXPORT',
                              export_image_format='NONE', export_skins=True, export_morph=False, export_yup=True)
    print('wrote', path, [(o.name, len(o.data.vertices), [s.material.name for s in o.material_slots]) for o in bpy.data.objects if o.type == 'MESH'])


for n, sp in CAST.items():
    build(n, sp)
