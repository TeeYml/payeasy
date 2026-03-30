import {
  isConnected as freighterIsConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

/**
 * Check if Freighter browser extension is installed and available.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const result = await freighterIsConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * Request access to the user's Freighter wallet.
 * Returns the public key on success.
 */
export async function connectWallet(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error("Freighter wallet extension is not installed");
  }

  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    const accessResult = await requestAccess();
    if ("error" in accessResult) {
      throw new Error("User rejected wallet connection");
    }
  }

  const addressResult = await getAddress();
  if ("error" in addressResult) {
    throw new Error("Failed to get wallet address");
  }

  return addressResult.address;
}

/**
 * Get the currently connected public key, or null if not connected.
 */
export async function getPublicKey(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const installed = await isFreighterInstalled();
    if (!installed) return null;

    const allowed = await isAllowed();
    if (!allowed.isAllowed) return null;

    const addressResult = await getAddress();
    if ("error" in addressResult) return null;

    return addressResult.address;
  } catch {
    return null;
  }
}

/**
 * Sign a transaction XDR string using Freighter.
 */
export async function signWithFreighter(
  transactionXDR: string,
  networkPassphrase: string
): Promise<string> {
  const result = await signTransaction(transactionXDR, {
    networkPassphrase,
  });

  if ("error" in result) {
    throw new Error(`Transaction signing failed: ${result.error}`);
  }

  return result.signedTxXdr;
}
