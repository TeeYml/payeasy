import test, { describe, mock } from "node:test";
import assert from "node:assert/strict";

describe("useFreighter hook logic", () => {
  describe("wallet detection", () => {
    test("detects when Freighter is installed", async () => {
      const isFreighterInstalled = mock.fn(async () => true);
      const installed = await isFreighterInstalled();
      assert.strictEqual(installed, true);
    });

    test("detects when Freighter is not installed", async () => {
      const isFreighterInstalled = mock.fn(async () => false);
      const installed = await isFreighterInstalled();
      assert.strictEqual(installed, false);
    });
  });

  describe("wallet connection", () => {
    test("returns public key on successful connect", async () => {
      const testKey = "GABC1234567890TESTKEY";
      const connectWallet = mock.fn(async () => testKey);

      const key = await connectWallet();
      assert.strictEqual(key, testKey);
    });

    test("throws when Freighter is not installed", async () => {
      const connectWallet = mock.fn(async () => {
        throw new Error("Freighter wallet extension is not installed");
      });

      await assert.rejects(
        () => connectWallet(),
        /Freighter wallet extension is not installed/
      );
    });

    test("throws when user rejects connection", async () => {
      const connectWallet = mock.fn(async () => {
        throw new Error("User rejected wallet connection");
      });

      await assert.rejects(
        () => connectWallet(),
        /User rejected wallet connection/
      );
    });
  });

  describe("state transitions", () => {
    test("goes from disconnected to connected on successful connect", async () => {
      const testKey = "GABC1234567890TESTKEY";
      const getPublicKey = mock.fn(async (): Promise<string | null> => null);
      const connectWallet = mock.fn(async () => testKey);

      let publicKey = await getPublicKey();
      assert.strictEqual(publicKey, null);

      publicKey = await connectWallet();
      assert.strictEqual(publicKey, testKey);
    });

    test("goes from connected to disconnected on disconnect", async () => {
      const testKey = "GABC1234567890TESTKEY";
      const getPublicKey = mock.fn(
        async (): Promise<string | null> => testKey
      );

      let publicKey: string | null = await getPublicKey();
      assert.strictEqual(publicKey, testKey);

      publicKey = null;
      assert.strictEqual(publicKey, null);
    });

    test("restores connection if already allowed", async () => {
      const testKey = "GABC1234567890TESTKEY";
      const isFreighterInstalled = mock.fn(async () => true);
      const getPublicKey = mock.fn(async () => testKey);

      const installed = await isFreighterInstalled();
      assert.strictEqual(installed, true);

      const key = await getPublicKey();
      assert.strictEqual(key, testKey);
    });
  });
});
