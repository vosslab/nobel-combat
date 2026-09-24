#!/usr/bin/env python3
"""Build the neutral, animated GLB placeholder used by the first playable."""

import json
import math
import pathlib
import struct


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT_PATH = REPO_ROOT / "src" / "assets" / "neutral_humanoid.glb"
JOINT_NAMES = [
	"Hips", "Spine", "Chest", "Head", "LeftShoulder", "LeftUpperArm",
	"LeftLowerArm", "RightShoulder", "RightUpperArm", "RightLowerArm",
	"LeftUpperLeg", "LeftLowerLeg", "RightUpperLeg", "RightLowerLeg",
]
PARENT_INDEX = [-1, 0, 1, 2, 2, 4, 5, 2, 7, 8, 0, 10, 0, 12]
LOCAL_TRANSLATIONS = [
	(0.0, 1.05, 0.0), (0.0, 0.35, 0.0), (0.0, 0.35, 0.0),
	(0.0, 0.45, 0.0), (-0.27, 0.27, 0.0), (0.0, -0.28, 0.27),
	(0.0, -0.30, 0.25), (0.27, 0.27, 0.0), (0.0, -0.28, -0.16),
	(0.0, -0.30, -0.25), (-0.15, -0.42, 0.30), (0.0, -0.43, -0.15),
	(0.15, -0.42, -0.30), (0.0, -0.43, 0.15),
]


def add_aligned(data: bytearray, payload: bytes) -> tuple[int, int]:
	"""Append payload on a four-byte boundary and return its offset and size."""
	while len(data) % 4:
		data.append(0)
	offset = len(data)
	data.extend(payload)
	return offset, len(payload)


def pack_floats(values: list[float]) -> bytes:
	return struct.pack(f"<{len(values)}f", *values)


def pack_shorts(values: list[int]) -> bytes:
	return struct.pack(f"<{len(values)}H", *values)


def normalize(vector: tuple[float, float, float]) -> tuple[float, float, float]:
	"""Return the unit vector needed for procedural surface normals."""
	length = math.sqrt(sum(value * value for value in vector))
	return tuple(value / length for value in vector)


def cross(first: tuple[float, float, float],
		  second: tuple[float, float, float]) -> tuple[float, float, float]:
	"""Return the right-handed cross product used to orient a limb cylinder."""
	return (
		first[1] * second[2] - first[2] * second[1],
		first[2] * second[0] - first[0] * second[2],
		first[0] * second[1] - first[1] * second[0],
	)


def add_vertex(vertices: list[float], normals: list[float], joints: list[int],
			   colors: list[float], position: tuple[float, float, float],
			   normal: tuple[float, float, float], joint: int,
			   color: tuple[float, float, float, float]) -> int:
	"""Append a fully attributed skinned vertex and return its index."""
	index = len(vertices) // 3
	vertices.extend(position)
	normals.extend(normal)
	joints.extend([joint, 0, 0, 0])
	colors.extend(color)
	return index


def add_cylinder(vertices: list[float], normals: list[float], joints: list[int],
			 colors: list[float], indices: list[int], start: tuple[float, float, float],
			 end: tuple[float, float, float], start_radius: float, end_radius: float,
			 joint: int, color: tuple[float, float, float, float]) -> None:
	"""Add an octagonal tapered limb with capped ends and readable flat facets."""
	axis = normalize(tuple(end[axis] - start[axis] for axis in range(3)))
	reference = (1.0, 0.0, 0.0) if abs(axis[1]) > 0.9 else (0.0, 1.0, 0.0)
	first_basis = normalize(cross(reference, axis))
	second_basis = cross(axis, first_basis)
	start_ring: list[int] = []
	end_ring: list[int] = []
	for side in range(8):
		angle = math.tau * side / 8.0
		radial = tuple(math.cos(angle) * first_basis[axis] + math.sin(angle) * second_basis[axis]
			for axis in range(3))
		start_position = tuple(start[axis] + start_radius * radial[axis] for axis in range(3))
		end_position = tuple(end[axis] + end_radius * radial[axis] for axis in range(3))
		start_ring.append(add_vertex(vertices, normals, joints, colors, start_position, radial, joint, color))
		end_ring.append(add_vertex(vertices, normals, joints, colors, end_position, radial, joint, color))
	for side in range(8):
		next_side = (side + 1) % 8
		indices.extend([start_ring[side], start_ring[next_side], end_ring[next_side]])
		indices.extend([start_ring[side], end_ring[next_side], end_ring[side]])
	start_cap = add_vertex(vertices, normals, joints, colors, start, tuple(-value for value in axis), joint, color)
	end_cap = add_vertex(vertices, normals, joints, colors, end, axis, joint, color)
	for side in range(8):
		next_side = (side + 1) % 8
		indices.extend([start_cap, start_ring[next_side], start_ring[side]])
		indices.extend([end_cap, end_ring[side], end_ring[next_side]])


def add_head(vertices: list[float], normals: list[float], joints: list[int],
			 colors: list[float], indices: list[int], center: tuple[float, float, float],
			 joint: int, color: tuple[float, float, float, float]) -> None:
	"""Add a compact octagonal head that stays distinct from the torso."""
	radii = (0.27, 0.30, 0.25)
	rings: list[list[int]] = []
	for latitude in range(1, 5):
		polar = math.pi * latitude / 5.0
		ring: list[int] = []
		for longitude in range(8):
			azimuth = math.tau * longitude / 8.0
			normal = normalize((math.sin(polar) * math.cos(azimuth), math.cos(polar),
				math.sin(polar) * math.sin(azimuth)))
			position = tuple(center[axis] + radii[axis] * normal[axis] for axis in range(3))
			ring.append(add_vertex(vertices, normals, joints, colors, position, normal, joint, color))
		rings.append(ring)
	top = add_vertex(vertices, normals, joints, colors,
		(center[0], center[1] + radii[1], center[2]), (0.0, 1.0, 0.0), joint, color)
	bottom = add_vertex(vertices, normals, joints, colors,
		(center[0], center[1] - radii[1], center[2]), (0.0, -1.0, 0.0), joint, color)
	for side in range(8):
		next_side = (side + 1) % 8
		indices.extend([top, rings[0][side], rings[0][next_side]])
		indices.extend([bottom, rings[-1][next_side], rings[-1][side]])
		for ring in range(len(rings) - 1):
			indices.extend([rings[ring][side], rings[ring + 1][side], rings[ring + 1][next_side]])
			indices.extend([rings[ring][side], rings[ring + 1][next_side], rings[ring][next_side]])


def world_positions() -> list[tuple[float, float, float]]:
	"""Calculate rest pose joint positions from the hierarchy translations."""
	positions: list[tuple[float, float, float]] = []
	for index, local_position in enumerate(LOCAL_TRANSLATIONS):
		parent = PARENT_INDEX[index]
		if parent == -1:
			positions.append(local_position)
			continue
		parent_position = positions[parent]
		positions.append(tuple(parent_position[axis] + local_position[axis]
			for axis in range(3)))
	return positions


def make_mesh() -> tuple[list[float], list[float], list[int], list[float], list[int]]:
	"""Create a readable neutral fighter using low-poly organic body primitives."""
	positions = world_positions()
	vertices: list[float] = []
	normals: list[float] = []
	joints: list[int] = []
	colors: list[float] = []
	indices: list[int] = []
	head_color = (1.0, 0.74, 0.55, 1.0)
	torso_color = (0.78, 0.82, 0.88, 1.0)
	limb_color = (0.45, 0.52, 0.62, 1.0)
	boot_color = (0.20, 0.24, 0.31, 1.0)
	add_cylinder(vertices, normals, joints, colors, indices, (0.0, 0.96, 0.0),
		(0.0, 1.20, 0.0), 0.30, 0.33, 0, torso_color)
	add_cylinder(vertices, normals, joints, colors, indices, (0.0, 1.08, 0.0),
		(0.0, 1.92, 0.0), 0.29, 0.39, 1, torso_color)
	add_cylinder(vertices, normals, joints, colors, indices, (0.0, 1.70, 0.0),
		(0.0, 2.05, 0.0), 0.40, 0.31, 2, torso_color)
	add_head(vertices, normals, joints, colors, indices, (0.0, 2.27, 0.0), 3, head_color)
	for upper, lower, upper_joint, lower_joint in [(4, 5, 5, 6), (7, 8, 8, 9)]:
		add_cylinder(vertices, normals, joints, colors, indices, positions[upper], positions[lower],
			0.16, 0.13, upper_joint, limb_color)
		add_cylinder(vertices, normals, joints, colors, indices, positions[lower], positions[lower + 1],
			0.13, 0.10, lower_joint, limb_color)
	for upper, lower, upper_joint, lower_joint in [(0, 10, 10, 11), (0, 12, 12, 13)]:
		add_cylinder(vertices, normals, joints, colors, indices, positions[upper], positions[lower],
			0.19, 0.15, upper_joint, limb_color)
		add_cylinder(vertices, normals, joints, colors, indices, positions[lower], positions[lower + 1],
			0.15, 0.11, lower_joint, limb_color)
	for ankle, joint in [(positions[11], 11), (positions[13], 13)]:
		toe = (ankle[0], 0.09, ankle[2] + 0.30)
		add_cylinder(vertices, normals, joints, colors, indices, ankle, toe, 0.13, 0.15, joint, boot_color)
	return vertices, normals, joints, colors, indices


def quaternion_x(degrees: float) -> list[float]:
	"""Return an X-axis rotation quaternion for the glTF animation channel."""
	half_angle = math.radians(degrees) / 2.0
	return [math.sin(half_angle), 0.0, 0.0, math.cos(half_angle)]


def animation_poses() -> dict[str, list[tuple[int, list[list[float]]]]]:
	"""Give every combat state a readable skeletal motion, with no mesh animation."""
	identity = [0.0, 0.0, 0.0, 1.0]
	return {
		"idle": [(2, [identity, quaternion_x(3), identity]),
			(5, [quaternion_x(-8), identity, quaternion_x(-8)]),
			(8, [quaternion_x(-8), identity, quaternion_x(-8)])],
		"move": [(5, [quaternion_x(-32), quaternion_x(32), quaternion_x(-32)]),
			(8, [quaternion_x(32), quaternion_x(-32), quaternion_x(32)]),
			(10, [quaternion_x(28), quaternion_x(-28), quaternion_x(28)]),
			(12, [quaternion_x(-28), quaternion_x(28), quaternion_x(-28)])],
		"light": [(8, [quaternion_x(-20), quaternion_x(-95), quaternion_x(-12)]),
			(9, [identity, quaternion_x(-18), identity])],
		"heavy": [(2, [identity, quaternion_x(-25), identity]),
			(8, [quaternion_x(-25), quaternion_x(-125), quaternion_x(-10)]),
			(9, [identity, quaternion_x(-35), identity])],
		"block": [(5, [identity, quaternion_x(-70), quaternion_x(-70)]),
			(8, [identity, quaternion_x(-70), quaternion_x(-70)])],
		"hit": [(2, [identity, quaternion_x(28), quaternion_x(10)]),
			(3, [identity, quaternion_x(20), identity])],
		"down": [(0, [identity, quaternion_x(78), quaternion_x(88)]),
			(2, [identity, quaternion_x(20), quaternion_x(20)])],
		"getup": [(0, [quaternion_x(88), quaternion_x(78), identity]),
			(2, [quaternion_x(20), quaternion_x(20), identity])],
	}


def build_glb() -> bytes:
	"""Assemble a standards-compliant GLB with a skinned mesh and eight clips."""
	vertices, normals, joints, indices = make_mesh()
	buffer = bytearray()
	buffer_views: list[dict[str, int]] = []
	accessors: list[dict[str, int | str | list[float]]] = []

	def add_accessor(payload: bytes, component_type: int, count: int, value_type: str,
				 target: int | None = None, minimum: list[float] | None = None,
				 maximum: list[float] | None = None) -> int:
		offset, length = add_aligned(buffer, payload)
		view: dict[str, int] = {"buffer": 0, "byteOffset": offset, "byteLength": length}
		if target is not None:
			view["target"] = target
		buffer_views.append(view)
		accessor: dict[str, int | str | list[float]] = {
			"bufferView": len(buffer_views) - 1, "componentType": component_type,
			"count": count, "type": value_type,
		}
		if minimum is not None:
			accessor["min"] = minimum
		if maximum is not None:
			accessor["max"] = maximum
		accessors.append(accessor)
		return len(accessors) - 1

	position_accessor = add_accessor(pack_floats(vertices), 5126, len(vertices) // 3,
		"VEC3", 34962, [-1.12, 0.0, -0.54], [1.12, 2.58, 0.60])
	normal_accessor = add_accessor(pack_floats(normals), 5126, len(normals) // 3, "VEC3", 34962)
	joint_accessor = add_accessor(pack_shorts(joints), 5123, len(joints) // 4, "VEC4", 34962)
	weights = [1.0, 0.0, 0.0, 0.0] * (len(joints) // 4)
	weight_accessor = add_accessor(pack_floats(weights), 5126, len(weights) // 4, "VEC4", 34962)
	index_accessor = add_accessor(pack_shorts(indices), 5123, len(indices), "SCALAR", 34963)

	inverse_bind_matrices: list[float] = []
	for position in world_positions():
		inverse_bind_matrices.extend([
			1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0, -position[0], -position[1], -position[2], 1.0,
		])
	bind_accessor = add_accessor(pack_floats(inverse_bind_matrices), 5126, len(JOINT_NAMES), "MAT4")

	animations: list[dict[str, object]] = []
	times = pack_floats([0.0, 0.30, 0.60])
	for name, joint_poses in animation_poses().items():
		time_accessor = add_accessor(times, 5126, 3, "SCALAR", minimum=[0.0], maximum=[0.60])
		samplers: list[dict[str, object]] = []
		channels: list[dict[str, object]] = []
		for joint, poses in joint_poses:
			flat_poses = [component for pose in poses for component in pose]
			output_accessor = add_accessor(pack_floats(flat_poses), 5126, 3, "VEC4")
			samplers.append({"input": time_accessor, "output": output_accessor, "interpolation": "LINEAR"})
			channels.append({"sampler": len(samplers) - 1,
				"target": {"node": joint + 1, "path": "rotation"}})
		animations.append({"name": name, "samplers": samplers, "channels": channels})

	nodes: list[dict[str, object]] = [{"name": "NeutralHumanoid", "mesh": 0, "skin": 0}]
	for index, name in enumerate(JOINT_NAMES):
		node: dict[str, object] = {"name": name, "translation": list(LOCAL_TRANSLATIONS[index])}
		children = [child for child, parent in enumerate(PARENT_INDEX) if parent == index]
		if children:
			node["children"] = [child + 1 for child in children]
		nodes.append(node)

	document: dict[str, object] = {
		"asset": {"version": "2.0", "generator": "build_neutral_humanoid.py"},
		"extensionsUsed": ["KHR_materials_unlit"],
		"scene": 0,
		"scenes": [{"nodes": [0, 1]}],
		"nodes": nodes,
		"meshes": [{"name": "NeutralHumanoidMesh", "primitives": [{
			"attributes": {"POSITION": position_accessor, "NORMAL": normal_accessor,
				"JOINTS_0": joint_accessor, "WEIGHTS_0": weight_accessor},
			"indices": index_accessor, "material": 0,
		}]}],
		"materials": [{"name": "NeutralGray", "pbrMetallicRoughness": {
			"baseColorFactor": [0.72, 0.72, 0.72, 1.0], "metallicFactor": 0.0,
			"roughnessFactor": 0.85,
		}, "extensions": {"KHR_materials_unlit": {}}}],
		"skins": [{"name": "NeutralHumanoidSkin", "inverseBindMatrices": bind_accessor,
			"joints": list(range(1, len(JOINT_NAMES) + 1)), "skeleton": 1}],
		"animations": animations,
		"buffers": [{"byteLength": len(buffer)}],
		"bufferViews": buffer_views,
		"accessors": accessors,
	}
	json_bytes = json.dumps(document, separators=(",", ":")).encode("utf-8")
	json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
	bin_bytes = bytes(buffer)
	bin_bytes += b"\0" * ((4 - len(bin_bytes) % 4) % 4)
	total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
	return b"".join([
		struct.pack("<4sII", b"glTF", 2, total_length),
		struct.pack("<I4s", len(json_bytes), b"JSON"), json_bytes,
		struct.pack("<I4s", len(bin_bytes), b"BIN\0"), bin_bytes,
	])


def validate_glb(glb_data: bytes) -> tuple[int, list[str]]:
	"""Reject a generated file that lacks the skin or required named clips."""
	magic, version, declared_length = struct.unpack_from("<4sII", glb_data)
	if magic != b"glTF" or version != 2 or declared_length != len(glb_data):
		raise ValueError("generated file does not have a valid GLB header")
	json_length, json_kind = struct.unpack_from("<I4s", glb_data, 12)
	if json_kind != b"JSON":
		raise ValueError("generated GLB has no JSON chunk")
	document = json.loads(glb_data[20:20 + json_length])
	skin = document["skins"][0]
	if len(skin["joints"]) != len(JOINT_NAMES):
		raise ValueError("generated GLB skin has the wrong joint count")
	clip_names = [animation["name"] for animation in document["animations"]]
	if clip_names != list(animation_poses()):
		raise ValueError("generated GLB clips do not match the combat states")
	for animation in document["animations"]:
		if not animation["channels"]:
			raise ValueError(f"animation {animation['name']} has no skeletal channels")
	return len(skin["joints"]), clip_names


def main() -> None:
	"""Write the reproducible placeholder asset and report its compact contents."""
	OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
	glb_data = build_glb()
	joint_count, clip_names = validate_glb(glb_data)
	OUTPUT_PATH.write_bytes(glb_data)
	print(f"wrote {OUTPUT_PATH.relative_to(REPO_ROOT)} ({len(glb_data)} bytes)")
	print(f"skin joints: {joint_count}; animation clips: {', '.join(clip_names)}")


if __name__ == "__main__":
	main()
