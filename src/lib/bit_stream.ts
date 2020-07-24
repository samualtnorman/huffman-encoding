export class BitStream {
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
		let i = 0
		
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
