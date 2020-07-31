import { red, green } from "chalk"

const callStack: string[] = []
const wrappedObjects = new Set

let disabled = true

export function profile(object: any, prefix = "", newObject?: object) {
	disabled = true

	if (object && !wrappedObjects.has(object)) {
		console.log(Object)

		wrappedObjects.add(object)

		for (const [ name, { value: original, writable } ] of Object.entries(Object.getOwnPropertyDescriptors(object))) {
			const fullName = prefix + name

			if (typeof original == "function") {
				profile(original, fullName + ".")

				if (writable) {
					console.log(red("r:"), fullName)

					let callFunction: (thisArg: any, args: any[]) => any

					if (original.prototype?.constructor)
						callFunction = (_, args) => new original(...args)
					else
						callFunction = (thisArg, ...args) => {
							if (object[name] == original.apply)
								return original.call(thisArg, ...args)

							return original.apply(thisArg, args)
						}

					object[name] = function (...args: any) {
						if (disabled)
							return callFunction(this, args)

						disabled = true

						callStack.push(fullName)

						const timerName = callStack.join(": ")

						console.log(green("c:"), timerName)

						// let res

						// if (this instanceof )

						callStack.pop()

						disabled = false

						return res
					}
				}
			} else if (typeof original == "object")
				profile(original, fullName + ".")
		}
	}

	disabled = false
}

// to replace functions, I need to replace the properties of the function, then generate a new function to wrap around the original, then copy all properties to the new one
