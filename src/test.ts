import { encode } from "./index"
import { readFileSync, writeFileSync } from "fs"

//console.log([ ...encode(readFileSync("./main.mjs")) ].map(a => "0".repeat(8 - a.toString(2).length) + a.toString(2)));

//console.log([ [ "foo" ], [ "bar" ] ].flat())

writeFileSync("encoded", encode(readFileSync("src/main.ts")))
