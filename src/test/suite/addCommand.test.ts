import * as assert from "assert";
import { makeCommandFilename } from "../../commands/addCommand";

suite("addCommand", () => {
  test("makeCommandFilename", () => {
    [
      {
        input: "Test A Command",
        should: "testACommand",
      },
      {
        input: "Test ~ A Command",
        should: "test~ACommand",
      },
      {
        input: "Test - A - Command",
        should: "test-A-Command",
      },
      {
        input: "Test . A - Command",
        should: "test.A-Command",
      },
      {
        input: " Test ",
        should: "test",
      },
    ].forEach(({ input, should }) => assert.strictEqual(makeCommandFilename(input), should));
  });
});
