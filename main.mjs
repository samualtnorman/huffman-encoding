"use strict";

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

	let o = "";

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

		o += decodeTree(tree)[v].toString(2).substring(1);
		max = v * 2;
	}

	return o + layers.flat().reverse().map(a => {
		let b = parseInt(a).toString(2);

		return "0".repeat(8 - b.length) + b;
	}).join("");

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
		const temp = [];

		for (let i = 0; i < nodeCount; i++) {
			const a = keys.shift() || 1;

			temp.push(a << 1);
			temp.push((a << 1) + 1);
		}

		keys.unshift(...temp);
	}

	return keys;
}
