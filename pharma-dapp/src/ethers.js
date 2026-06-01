

import "dotenv/config";
import { Contract, WebSocketProvider } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const contractAddress = "0xd923A95aEc6157aCCA8E84B6C4c9C2b3C7422a40";

// Load full ABI from PharmaABI.json — guaranteed to match contract
const abi = JSON.parse(
  readFileSync(join(__dirname, "../public/PharmaABI.json"), "utf8")
);

const provider = new WebSocketProvider(
  "https://eth-hoodi.g.alchemy.com/v2/UiCANatOqd8nWW5f791tf"
);

// Log when connected
provider.on("network", (newNetwork) => {
  console.log("🌐 Connected to network:", newNetwork.name, "chainId:", newNetwork.chainId);
});

const instance = new Contract(contractAddress, abi, provider);

export default instance;