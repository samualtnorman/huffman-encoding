class AssertionError extends Error {
	constructor(message = "") {
		super("Asserion failed: " + message);
	}
}

interface TreeNode {
	frequency: number
	data?: any
	left?: TreeNode
	right?: TreeNode
}

class BitStream {
	length = 0
	buffer: Uint8Array

	constructor(...elements: (boolean | number)[]) {
		this.buffer = new Uint8Array(0)
		this.push(...elements)

		return this
	}

	push(...elements: (boolean | number)[]) {
		this.allocateSpace(elements.length)

		for (let element of elements) {
			let byteI = Math.floor(this.length / 8),
				byte = this.buffer[byteI],
				mask = 0b10000000 >> (this.length++ % 8)

			this.buffer[byteI] = element ? byte | mask : byte & ~mask
		}

		return this.length
	}

	* [Symbol.iterator]() {
		let i         = 0
		
		while (i < this.length)
			yield !!(this.buffer[Math.floor(this.length / 8)] & (0b10000000 >> (i++ % 8)))
	}

	private allocateSpace(bitsWanted: number) {
		let byteCount = Math.ceil((this.length + bitsWanted) / 8)

		if (byteCount > this.buffer.length) {
			let oldBuffer = this.buffer
			this.buffer = new Uint8Array(byteCount)
			this.buffer.set(oldBuffer)
		}
	}

	pushByte(...bytes: number[]) {
		this.allocateSpace(bytes.length * 8)

		for (let byteToWrite of bytes)
			for (let j = 8; j--;) {
				let byteI = Math.floor(this.length / 8),
					byte  = this.buffer[byteI],
					mask  = 0b10000000 >> (this.length++ % 8)

				this.buffer[byteI] = (byteToWrite & (1 << j)) ? byte | mask : byte & ~mask
			}

		return this.length
	}
}

export function encode(buffer: Buffer) {
	let nodes: TreeNode[] = Object.entries<number>(countArrayItems(buffer)).map(([ data, frequency]) => ({ data, frequency }))

	while (nodes.length > 1) {
		nodes.sort((a, b) => b.frequency - a.frequency)

		const left  = nodes.pop(),
			  right = nodes.pop()

		if (!left || !right)
			throw new AssertionError("popped tree node returned undefined" )

		nodes.push({ left, right, frequency: left.frequency + right.frequency })
	}

	const layers: Number[][] = [],
	      depths = getDepths(nodes[0])

	for (let [ byte, depth ] of Object.entries<number>(depths))
		(layers[depth] = layers[depth] || []).push(parseInt(byte))

	let bitStream = new BitStream,
		max = 1,
		tree = []

	for (let layer of layers) {
		layer = layer || []

		let v = max - layer.length,
			i = 0,
			metaTree = []
		
		tree.push(v)

		while (max) {
			if (max < 2 ** i) {
				metaTree.push(max)
				max = 0
			} else {
				metaTree.push(2 ** i)
				max -= 2 ** i
			}

			i++
		}

		bitStream.push(...decodeTree(metaTree)[v])

		max = v * 2
	}

	let keys: number[] = Object.entries(depths).sort((a, b) => b[1] - a[1]).map(a => parseInt(a[0])),
		encodedBytes   = decodeTree(tree)
	
	bitStream.pushByte(...keys)

	for (let byte of buffer)
		bitStream.push(...encodedBytes[keys.indexOf(byte)])
	
	return bitStream.buffer

	function getDepths(tree: TreeNode, layer = 0, depths: { [key: string]: number } = {}) {
		if ("data" in tree)
			depths[tree.data] = layer;
		else {
			if (!tree.left || !tree.right)
				throw new AssertionError("tree branch unexpectedly undefined");

			getDepths(tree.left , layer + 1, depths);
			getDepths(tree.right, layer + 1, depths);
		}
		
		return depths;
	}
}

function countArrayItems(array: any[] | Buffer) {
	const usages: { [key: string]: number } = {}

	for (let item of array)
		usages[item] = usages[item] + 1 || 1

	return usages
}

export function decode() {
	
}

function decodeTree(tree: number[]) {
	const keys: BitStream[] = []

	for (let nodeCount of tree) {
		const newKeys = []

		for (let i = 0; i < nodeCount; i++) {
			const original = keys.shift() || new BitStream
			
			newKeys.push(new BitStream(...original, 0))
			newKeys.push(new BitStream(...original, 1))
		}

		keys.unshift(...newKeys)
	}

	return keys
}
