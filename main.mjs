"use strict";

console.time();
console.log(encode("Hello, World!"));
console.timeEnd();

export function encode(string) {
	let characterUsages = {};

	for (let char of string)
		characterUsages[char] = characterUsages[char] + 1 || 1;

	characterUsages = Object.entries(characterUsages).map(([ character, frequency ]) => ({ character, frequency }));

	while (characterUsages.length != 1) {
		characterUsages.sort((a, b) => b.frequency - a.frequency);

		const left  = characterUsages.pop(),
			  right = characterUsages.pop();
		

		characterUsages.push({ left, right, frequency: left.frequency + right.frequency });
	}

	const layers = [];

	for (let [ char, depth ] of Object.entries(getDepths(characterUsages.pop())))
		(layers[depth] = layers[depth] || []).push(char);
	
	const treeNodeCounts = [];

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

		tree.push(0);

		treeNodeCounts.push(tree);
		max = v * 2;
	}

	// todo: convert treeNodeCounts to huffman encoded values

	return [ ...treeNodeCounts, ...layers.flat().reverse() ];

	function getDepths(tree, layer = 0) {
		if (tree.character)
			return { [tree.character]: layer };
		
		return { ...getDepths(tree.left, layer + 1), ...getDepths(tree.right, layer + 1) };
	}
}

export function decode() {
	
}

function decodeTree(tree, values) {
	let o = {};

	// todo: map values to huffman binary
}
