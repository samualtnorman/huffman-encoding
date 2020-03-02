"use strict";

export function encode(string) {
	console.time();

	let characterUsages = {};

	for (let char of string)
		characterUsages[char] = characterUsages[char] + 1 || 1;

	characterUsages = Object.entries(characterUsages).map(([character, frequency]) => ({ character, frequency }));

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

		treeNodeCounts.push(max - layer.length);
		max = (max - layer.length) * 2;
	}

	// todo: convert treeNodeCounts to huffman encoded values

	return [ ...treeNodeCounts, ...layers.flat() ];

	console.timeEnd();

	function getDepths(tree, layer = 0) {
		if (tree.character)
			return { [tree.character]: layer };
		
		return { ...getDepths(tree.left, layer + 1), ...getDepths(tree.right, layer + 1) };
	}
}

console.log(encode("Hello, World!"));
