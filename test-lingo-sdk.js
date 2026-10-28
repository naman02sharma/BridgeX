const { LingoDotDevEngine } = require("lingo.dev/sdk");

const lingo = new LingoDotDevEngine({
  apiKey: "test",
});

console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(lingo)));
console.log("Instance keys:", Object.keys(lingo));
