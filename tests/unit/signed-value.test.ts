import { test } from "node:test";
import assert from "node:assert/strict";
import { signValue, verifySignedValue } from "../../src/lib/signed-value";

const SECRET = "x".repeat(48);

test("signed cookie: подпись и проверка", () => {
  const s = signValue("cm3cart123", SECRET);
  assert.equal(verifySignedValue(s, SECRET), "cm3cart123");
});

test("signed cookie: подделка отклоняется", () => {
  const s = signValue("cm3cart123", SECRET);
  assert.equal(verifySignedValue(s.replace("cm3cart123", "cm3cart999"), SECRET), null); // чужой id
  assert.equal(verifySignedValue(s, "y".repeat(48)), null); // другой секрет
  assert.equal(verifySignedValue(s.slice(0, -2), SECRET), null); // обрезанная подпись
  assert.equal(verifySignedValue("cm3cart123", SECRET), null); // без подписи
  assert.equal(verifySignedValue(undefined, SECRET), null);
});

test("signed cookie: слабый секрет запрещён", () => {
  assert.throws(() => signValue("id", "short"));
  assert.throws(() => signValue("a.b", SECRET));
});
