/**
 * 0G Storage upload helper.
 *
 * Usage:
 *   node upload.mjs <json-content-string>
 *
 * Env vars (inherited from Python process):
 *   ZG_CHAIN_RPC          — EVM RPC endpoint
 *   ZG_CHAIN_PRIVATE_KEY  — wallet private key (0x...)
 *   ZG_INDEXER_URL        — 0G Storage indexer URL
 *
 * Prints a single JSON line to stdout:
 *   {"root_hash": "<hex>"}   on success
 *   {"error": "<message>"}   on failure
 */

import { ZgFile, Indexer } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const RPC_URL     = process.env.ZG_CHAIN_RPC    || "https://evmrpc-testnet.0g.ai";
const INDEXER_URL = process.env.ZG_INDEXER_URL  || "https://indexer-storage-testnet-turbo.0g.ai";
const PRIVATE_KEY = process.env.ZG_CHAIN_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.log(JSON.stringify({ error: "ZG_CHAIN_PRIVATE_KEY not set" }));
  process.exit(1);
}

const content = process.argv[2];
if (!content) {
  console.log(JSON.stringify({ error: "No content argument provided" }));
  process.exit(1);
}

async function main() {
  // Write content to a temp file
  const tmpDir  = mkdtempSync(join(tmpdir(), "synapse-"));
  const tmpFile = join(tmpDir, "knowledge.json");
  writeFileSync(tmpFile, content, "utf8");

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const indexer  = new Indexer(INDEXER_URL);

    const zgFile = await ZgFile.fromFilePath(tmpFile);

    // Compute Merkle tree — required before upload
    const [merkleTree, treeErr] = await zgFile.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = merkleTree.rootHash();

    // Upload to 0G Storage
    const [txHash, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer);
    await zgFile.close();

    if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

    console.log(JSON.stringify({ root_hash: rootHash, tx_hash: txHash }));
  } finally {
    try { unlinkSync(tmpFile); } catch (_) {}
  }
}

main().catch((e) => {
  console.log(JSON.stringify({ error: String(e.message || e) }));
  process.exit(1);
});
