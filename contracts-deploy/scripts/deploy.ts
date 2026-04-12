import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const privateKey = process.env.ZG_PRIVATE_KEY;
  if (!privateKey) throw new Error("ZG_PRIVATE_KEY not set");

  const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying from:", wallet.address);
  console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "OG");

  const artifactPath = join(__dirname, "../artifacts/contracts/KnowledgeRegistry.sol/KnowledgeRegistry.json");
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  console.log("Waiting for deployment...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\nKnowledgeRegistry deployed to:", address);
  console.log("\nAdd this to backend/.env:");
  console.log(`ZG_KNOWLEDGE_REGISTRY_ADDRESS=${address}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
