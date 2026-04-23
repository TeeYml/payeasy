import test, { mock } from "node:test";
import assert from "node:assert/strict";

let loadAccountBehavior: () => Promise<unknown> = async () => ({ balances: [] });

const mockLoadAccount = mock.fn(async () => loadAccountBehavior());

mock.module("@stellar/stellar-sdk", {
  namedExports: {
    Horizon: {
      Server: class MockHorizonServer {
        constructor(_url: string) {}
        loadAccount = mockLoadAccount;
      },
    },
  },
});

const { fetchAccountBalances, fetchXlmBalance } = await import(
  "../lib/stellar/horizon.ts"
);

test("fetchAccountBalances returns parsed XLM and token balances", async () => {
  loadAccountBehavior = async () => ({
    balances: [
      { balance: "100.0000000", asset_type: "native" },
      {
        balance: "50.0000000",
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer:
          "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      },
    ],
  });

  const result = await fetchAccountBalances("GABC123", "testnet");

  assert.strictEqual(result.accountId, "GABC123");
  assert.strictEqual(result.balances.length, 2);

  assert.deepStrictEqual(result.balances[0], {
    assetType: "native",
    assetCode: "XLM",
    assetIssuer: null,
    balance: "100.0000000",
  });

  assert.deepStrictEqual(result.balances[1], {
    assetType: "credit_alphanum4",
    assetCode: "USDC",
    assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    balance: "50.0000000",
  });
});

test("fetchAccountBalances throws on account not found (404)", async () => {
  const notFound = Object.assign(new Error("Not Found"), {
    response: { status: 404 },
  });
  loadAccountBehavior = async () => {
    throw notFound;
  };

  await assert.rejects(
    () => fetchAccountBalances("GNOTFOUND", "testnet"),
    (err: Error) => {
      assert.match(err.message, /Account not found: GNOTFOUND/);
      return true;
    }
  );
});

test("fetchAccountBalances throws on network failure", async () => {
  loadAccountBehavior = async () => {
    throw new Error("Network error");
  };

  await assert.rejects(
    () => fetchAccountBalances("GABC123", "testnet"),
    (err: Error) => {
      assert.match(err.message, /Failed to fetch balances: Network error/);
      return true;
    }
  );
});

test("fetchXlmBalance returns the native XLM balance", async () => {
  loadAccountBehavior = async () => ({
    balances: [{ balance: "250.5000000", asset_type: "native" }],
  });

  const balance = await fetchXlmBalance("GABC123", "testnet");
  assert.strictEqual(balance, "250.5000000");
});

test("fetchXlmBalance returns '0' if no native balance found", async () => {
  loadAccountBehavior = async () => ({ balances: [] });

  const balance = await fetchXlmBalance("GABC123", "testnet");
  assert.strictEqual(balance, "0");
});
