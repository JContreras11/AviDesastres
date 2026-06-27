// Run: npx tsx src/lib/format.test.ts
import { cedulaReal } from "./format";
import assert from "node:assert";

assert.equal(cedulaReal("25F"), null, "edad+sexo no es cédula");
assert.equal(cedulaReal("F"), null);
assert.equal(cedulaReal("12"), null, "edad suelta no es cédula");
assert.equal(cedulaReal("V-12345678"), "V-12345678");
assert.equal(cedulaReal("30702231"), "30702231");
assert.equal(cedulaReal(null), null);
assert.equal(cedulaReal("  18.938.865 "), "18.938.865", "puntos ok si 6+ dígitos");
console.log("ok");
