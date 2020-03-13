"use strict";

import bytestreamjs from "bytestreamjs";

const { BitStream } = bytestreamjs;

export function encode(buffer) {
	let nodes = Object.entries(countArrayItems(buffer)).map(([ character, frequency ]) => ({ character, frequency }));

	while (nodes.length != 1) {
		nodes.sort((a, b) => b.frequency - a.frequency);

		const left  = nodes.pop(),
			  right = nodes.pop();

		nodes.push({ left, right, frequency: left.frequency + right.frequency });
	}

	const layers = [];

	for (let [ char, depth ] of Object.entries(getDepths(nodes.pop())))
		(layers[depth] = layers[depth] || []).push(char);

	let o = new BitStream;

	let max = 1;

	for (let layer of layers) {
		layer = layer || [];

		let v = max - layer.length,
			i = 0,
			tree = [];

		while (max) {
			if (max < 2 ** i) {
				tree.push(max);
				max = 0;
			} else {
				tree.push(2 ** i);
				max -= 2 ** i;
			}

			i++;
		}

		o.append(decodeTree(tree)[v]);

		max = v * 2;
	}

	for (let byte of layers.flat().reverse())
		for (let i = 0; i < 8; i++)
			o.append(Number(!!(parseInt(byte) & (0b10000000 >> i))));

	return o.view;

	function getDepths(tree, layer = 0) {
		if (tree.character)
			return { [tree.character]: layer };
		
		return { ...getDepths(tree.left, layer + 1), ...getDepths(tree.right, layer + 1) };
	}
}

function countArrayItems(array) {
	const usages = {};

	for (let item of array)
		usages[item] = usages[item] + 1 || 1;

	return usages;
}

export function decode() {
	
}

function decodeTree(tree) {
	const keys = [];

	for (let nodeCount of tree) {
		const newKeys = [];

		for (let i = 0; i < nodeCount; i++) {
			const original = keys.shift() || new BitStream,
				  left     = new BitStream(original),
				  right    = new BitStream(original);
			
			left.append(0);
			right.append(1);
			newKeys.push(left);
			newKeys.push(right);
		}

		keys.unshift(...newKeys);
	}

	return keys;
}
