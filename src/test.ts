// import { encode } from "./index"
// import { BitStream } from "./lib/bit_stream"
import { replaceObjectFunctions } from "./lib/profiling"

replaceObjectFunctions(global)

console.log("Hello, World!")

// let bitStream = new BitStream

// bitStream.pushByte(...encode(Buffer.from("Hello, World!", 'utf8')))

// console.log([ ...bitStream ].map(a => Number(a)).join(""))

// {
// 	const { log, timeEnd } = console

// 	console.log = function (...args) {
// 		log("start", ...args, "end")
// 		// timeEnd()
// 	}

// 	console.time()
// 	console.timeEnd()
// }
