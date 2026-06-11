// Generates a FRESH, THROWAWAY testnet wallet and writes the key into .env.
// Testnet only — never put real funds in this wallet.
const { Wallet } = require("ethers");
const fs = require("fs");
const path = require("path");

const wallet = Wallet.createRandom();
const envPath = path.join(__dirname, "..", ".env");
const examplePath = path.join(__dirname, "..", ".env.example");

let env = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf8")
  : fs.readFileSync(examplePath, "utf8");

if (/^PRIVATE_KEY=.*$/m.test(env)) {
  env = env.replace(/^PRIVATE_KEY=.*$/m, `PRIVATE_KEY=${wallet.privateKey}`);
} else {
  env += `\nPRIVATE_KEY=${wallet.privateKey}\n`;
}
fs.writeFileSync(envPath, env);

console.log("\n✅ Throwaway TESTNET wallet generated and saved to .env (git-ignored).\n");
console.log("   Deposit address:", wallet.address);
console.log("\n👉 Fund it for FREE:");
console.log("   1. Open  https://faucet.sepolia.mantle.xyz");
console.log("   2. Paste this address:", wallet.address);
console.log("   3. Request test MNT (free). ~0.5 MNT is plenty.");
console.log("\n   The private key is in .env only. Never reuse this wallet for real funds.\n");
