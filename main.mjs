"use strict";

class BitStream {
	length = 0;

	constructor(...elements) {
		this.buffer = new Uint8Array;
		this.push(...elements);
	}

	push(...elements) {
		let byteCount = Math.ceil((this.length + elements.length) / 8);

		if (byteCount > this.buffer.length) {
			let oldBuffer = this.buffer;
			this.buffer = new Uint8Array(byteCount);
			this.buffer.set(oldBuffer);
		}

		for (let element of elements) {
			let byteI = Math.floor(this.length / 8),
				byte = this.buffer[byteI],
				mask = 0b10000000 >> (this.length++ % 8);

			this.buffer[byteI] = element ? byte | mask : byte & ~mask;
		}

		return this.length;
	}

	pushString(...string) {
		string = string.join("");

		let byteCount = Math.ceil((this.length + string.length * 8) / 8);

		if (byteCount > this.buffer.length) {
			let oldBuffer = this.buffer;
			this.buffer = new Uint8Array(byteCount);
			this.buffer.set(oldBuffer);
		}

		for (let i = 0; i < string.length; i++)
			for (let j = 8; j--;) {
				let byteI = Math.floor(this.length / 8),
					byte = this.buffer[byteI],
					mask = 0b10000000 >> (this.length++ % 8);

				this.buffer[byteI] = (string.charCodeAt(i) & (1 << j)) ? byte | mask : byte & ~mask;
			}

		return this.length;

		//this.push(...strings.join("").split("").map(c => c.charCodeAt(0).toString(2).split("").map(a => Number(a))).flat());
	}

	[Symbol.iterator]() {
		let i         = 0,
		    bitStream = this;

		return {
			next() {
				let o = { value: undefined, done: false };

				if (i < bitStream.length)
					o.value = !!(bitStream.buffer[Math.floor(bitStream.length / 8)] & (0b10000000 >> (i++ % 8)));
				else
					o.done = true;

				return o;
			}
		}
	}
}

export function encode(buffer) {
	let nodes = Object.entries(countArrayItems(buffer)).map(([ byte, frequency ]) => ({ byte, frequency }));

	while (nodes.length != 1) {
		nodes.sort((a, b) => b.frequency - a.frequency);

		const left  = nodes.pop(),
			  right = nodes.pop();

		nodes.push({ left, right, frequency: left.frequency + right.frequency });
	}

	const layers = [];

	for (let [ char, depth ] of Object.entries(getDepths(nodes.pop())))
		(layers[depth] = layers[depth] || []).push(char);

	let bitStream = new BitStream,
		max = 1,
		tree = [];

	for (let layer of layers) {
		layer = layer || [];

		let v = max - layer.length,
			i = 0,
			metaTree = [];
		
		tree.push(v);

		while (max) {
			if (max < 2 ** i) {
				metaTree.push(max);
				max = 0;
			} else {
				metaTree.push(2 ** i);
				max -= 2 ** i;
			}

			i++;
		}

		bitStream.push(...decodeTree(metaTree)[v]);

		max = v * 2;
	}

	let keys = layers.flat().reverse().map(Number),
		encodedBytes = decodeTree(tree);
	
	bitStream.pushString(...keys);

	//console.log(JSON.stringify(keys));

	for (let byte of buffer)
		bitStream.push(...encodedBytes[keys.indexOf(byte)]);
	
	return bitStream.buffer;

	function getDepths(tree, layer = 0) {
		if (tree.byte)
			return { [tree.byte]: layer };
		
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
			const original = keys.shift() || new BitStream;
			
			newKeys.push(new BitStream(...original, 0));
			newKeys.push(new BitStream(...original, 1));
		}

		keys.unshift(...newKeys);
	}

	return keys;
}
