import { BitStream } from "./lib/bit_stream"
import { profile } from "./lib/profiling"

interface TreeNode {
	frequency: number
	data?: any
	left?: TreeNode
	right?: TreeNode
}

export function encode(buffer: Buffer) {
	const nodes: TreeNode[] = []

	for (const [ data, frequency ] of countArrayItems(buffer))
		nodes.push({ data, frequency })

	while (nodes.length > 1) {
		nodes.sort((a, b) => b.frequency - a.frequency)

		const left  = nodes.pop(),
			  right = nodes.pop()

		assert(left && right, "popped tree node was undefined")

		nodes.push({ left, right, frequency: left.frequency + right.frequency })
	}

	const layers: Number[][] = []
	const depths = getDepths(nodes[0])

	for (const [ byte, depth ] of depths)
		(layers[depth] = layers[depth] || []).push(parseInt(byte))

	const outputBitStream = new BitStream
	const tree = []
		
	let max = 1

	for (let layer of layers) {
		layer = layer || []

		const v = max - layer.length
		let i = 0
		const metaTree = []
		
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

		outputBitStream.push(...decodeTree(metaTree)[v])

		max = v * 2
	}

	const keys: number[] = [ ...depths ].sort((a, b) => b[1] - a[1]).map(a => parseInt(a[0]))
	const encodedBytes   = decodeTree(tree)
	
	outputBitStream.pushByte(...keys)

	for (const byte of buffer)
		outputBitStream.push(...encodedBytes[keys.indexOf(byte)])
	
	return outputBitStream.buffer
}

function getDepths(tree: TreeNode, layer = 0, depths: Map<any, number> = new Map) {
	if ("data" in tree)
		depths.set(tree.data, layer)
	else {
		assert(tree.left && tree.right, "tree branch was undefined")
		getDepths(tree.left , layer + 1, depths)
		getDepths(tree.right, layer + 1, depths)
	}

	return depths
}

function countArrayItems(array: any[] | Buffer) {
	const usages = new Map<any, number>()

	for (const item of array)
		usages.set(item, usages.get(item) || 0 + 1)

	return usages
}

export function decode() {
	
}

function decodeTree(tree: number[]) {
	const keys: BitStream[] = []

	for (const nodeCount of tree) {
		const newKeys: BitStream[] = []

		for (let i = 0; i < nodeCount; i++) {
			const original = keys.shift() || new BitStream
			
			newKeys.push(new BitStream(...original, 0))
			original.push(1)
			newKeys.push(original)
		}

		keys.unshift(...newKeys)
	}

	return keys
}

function assert(condition: any, message?: string): asserts condition {
    if (!condition)
		throw new Error(message || "Assertion failed")
}

// export default {
// 	encode
// }

profile(this)
