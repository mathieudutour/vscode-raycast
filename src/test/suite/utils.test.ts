import * as assert from "assert";
import { toCamelCase } from "../../utils";

test("toCamelCase", () => {
  [
    {
      input: "test",
      should: "Test",
    },
    {
      input: "Test",
      should: "Test",
    },
    {
      input: "A Cmd - With Characters",
      should: "ACmdWithCharacters",
    },
    {
      input: "A ~. Cmd",
      should: "ACmd",
    },
    {
      input: " Test ",
      should: "Test",
    },
  ].forEach(({ input, should }) => assert.strictEqual(toCamelCase(input), should));

  [
    {
      input: "test",
      not: "test",
    },
  ].forEach(({ input, not }) => assert.notStrictEqual(toCamelCase(input), not));
});
