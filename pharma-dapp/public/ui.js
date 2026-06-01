// ui.js — ethers.js v5 — Hoodi Testnet (560048 = 0x88BB0)

const STATUS_LABELS = [
  "Manufactured",
  "Shipped to Distributor",
  "Received by Distributor",
  "Sent to Pharmacy",
  "Available at Pharmacy",
  "Sold",
];
const STATUS_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-yellow-100 text-yellow-800",
  "bg-orange-100 text-orange-800",
  "bg-purple-100 text-purple-800",
  "bg-green-100 text-green-800",
  "bg-gray-100 text-gray-800",
];

let provider, signer, contract;
let isConnecting = false;

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Please install MetaMask.");
    return false;
  }
  if (isConnecting) return false;
  isConnecting = true;

  try {
    let accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    }
    if (!accounts || accounts.length === 0) {
      showError("No accounts found. Please unlock MetaMask.");
      return false;
    }

    const currentChain = await window.ethereum.request({ method: "eth_chainId" });
    const HOODI_HEX    = "0x88bb0"; 

    console.log("Current chain:", currentChain, "| Need: 0x88bb0 (560048)");

    if (currentChain.toLowerCase() !== HOODI_HEX) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x88BB0" }],
        });
        await new Promise((r) => setTimeout(r, 500));
      } catch (switchErr) {
        console.error("Switch error:", switchErr.code, switchErr.message);
        if (switchErr.code === -32002) {
          showError("MetaMask is busy. Open MetaMask and approve the pending request.");
        } else if (switchErr.code === 4902) {
          showError("Hoodi network not found in MetaMask. Please add it manually: Chain ID 560048, RPC: https://eth-hoodi.g.alchemy.com/v2/UiCANatOqd8nWW5f791tf");
        } else {
          showError("Network switch failed: " + switchErr.message);
        }
        return false;
      }
    }

    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    signer   = provider.getSigner();

    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    console.log("✅ Connected:", address);
    console.log("✅ Chain ID:", network.chainId);
    console.log("✅ Contract:", CONTRACT_ADDRESS);

    if (network.chainId !== 560048) {
      showError("Wrong network. Please switch to Hoodi Testnet (Chain ID: 560048) in MetaMask.");
      return false;
    }


    setEl("walletAddress", truncate(address));
    setEl("networkName", "Hoodi Testnet (" + network.chainId + ")");
    show("walletInfo");
    hide("connectBtn");


    const abi = await fetch("/PharmaABI.json").then((r) => r.json());
    contract  = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    console.log("✅ Contract loaded:", contract.address);

    if (typeof onContractReady === "function") onContractReady();
    return true;

  } catch (err) {
    console.error("connectWallet error:", err);
    if (err.code === -32002) {
      showError("MetaMask busy — open MetaMask and approve the pending request, then click Connect again.");
    } else {
      showError("Connection failed: " + (err.message || err));
    }
    return false;
  } finally {
    isConnecting = false;
  }
}

window.addEventListener("load", async () => {
  if (!window.ethereum) return;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts && accounts.length > 0) await connectWallet();
  } catch (e) {
    console.warn("Auto-connect skipped:", e.message);
  }
  window.ethereum.on("chainChanged",    ()        => location.reload());
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length > 0) connectWallet();
  });
});

async function addMedicine(data) {
  setLoading(true, "Adding medicine to blockchain...");
  try {
    const tx = await contract.addMedicine(
      data.medicineId, data.name, data.batchNumber,
      data.manufacturingDate, data.expiryDate, data.manufacturerName
    );
    showTxHash(tx.hash);
    await tx.wait();
    const res  = await fetch("/api/medicine/save", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...data, txHash: tx.hash }),
    });
    const json = await res.json();
    if (json.qrPath) showQR(json.qrPath);
    showSuccess("✅ Medicine added successfully!");
  } catch (err) {
    showError(err.reason || err.message || "Transaction failed");
  } finally {
    setLoading(false);
  }
}

// ─── Assign Distributor ───────────────────────────────────
async function assignDistributor(medicineId, distributorName, distributorAddress) {
  setLoading(true, "Assigning distributor...");
  try {
    const tx = await contract.assignDistributor(medicineId, distributorName, distributorAddress);
    showTxHash(tx.hash); await tx.wait();
    showSuccess("✅ Distributor assigned!");
  } catch (err) {
    showError(err.reason || err.message);
  } finally { setLoading(false); }
}

async function receiveByDistributor(medicineId) {
  setLoading(true, "Confirming receipt...");
  try {
    const tx = await contract.receiveByDistributor(medicineId);
    showTxHash(tx.hash); await tx.wait();
    showSuccess("✅ Receipt confirmed!");
  } catch (err) {
    showError(err.reason || err.message);
  } finally { setLoading(false); }
}

async function assignPharmacy(medicineId, pharmacyName, pharmacyAddress) {
  setLoading(true, "Assigning pharmacy...");
  try {
    const tx = await contract.assignPharmacy(medicineId, pharmacyName, pharmacyAddress);
    showTxHash(tx.hash); await tx.wait();
    showSuccess("✅ Pharmacy assigned!");
  } catch (err) {
    showError(err.reason || err.message);
  } finally { setLoading(false); }
}

async function markAvailable(medicineId) {
  setLoading(true, "Marking as available...");
  try {
    const tx = await contract.markAvailableAtPharmacy(medicineId);
    showTxHash(tx.hash); await tx.wait();
    showSuccess("✅ Marked as available!");
  } catch (err) {
    showError(err.reason || err.message);
  } finally { setLoading(false); }
}

async function sellMedicine(medicineId) {
  setLoading(true, "Processing sale...");
  try {
    const tx = await contract.sellMedicine(medicineId);
    showTxHash(tx.hash); await tx.wait();
    showSuccess("✅ Medicine sold!");
  } catch (err) {
    showError(err.reason || err.message);
  } finally { setLoading(false); }
}

// ─── Get Medicine ─────────────────────────────────────────
async function getMedicine(medicineId) {
  try {
    const m = await contract.getMedicine(medicineId);
    return {
      medicineId:        m[0],
      name:              m[1],
      batchNumber:       m[2],
      manufacturingDate: m[3],
      expiryDate:        m[4],
      manufacturerName:  m[5],
      distributorName:   m[6],
      pharmacyName:      m[7],
      currentOwner:      m[8],
      currentStatus:     Number(m[9]),
      timestamp:         Number(m[10]),
    };
  } catch (err) {
    showError("Medicine not found on blockchain.");
    return null;
  }
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}
function hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}
function showTxHash(hash) {
  const el = document.getElementById("txHashBox");
  if (el) {
    el.innerHTML = `✅ Transaction sent!
      <br/><a href="https://hoodi.etherscan.io/tx/${hash}"
      target="_blank"
      class="underline text-blue-600 break-all text-xs">${hash}</a>`;
    el.classList.remove("hidden");
  }
}

function showSuccess(msg) {
  const el = document.getElementById("successMsg");
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 8000);
  }
}
function showError(msg) {
  const el = document.getElementById("errorMsg");
  if (el) {
    el.textContent = "❌ " + msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 10000);
  }
  console.error("Error:", msg);
}
function setLoading(active, msg = "Processing...") {
  const el  = document.getElementById("loadingOverlay");
  const txt = document.getElementById("loadingText");
  if (!el) return;
  if (active) {
    if (txt) txt.textContent = msg;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}
function showQR(qrPath) {
  const el  = document.getElementById("qrImage");
  const box = document.getElementById("qrBox");
  if (el)  { el.src = qrPath; el.classList.remove("hidden"); }
  if (box) box.classList.remove("hidden");
}
function showQRImage(qrPath, imgId = "qrImage", boxId = "qrBox") {
  const el  = document.getElementById(imgId);
  const box = document.getElementById(boxId);
  if (el)  { el.src = qrPath; el.classList.remove("hidden"); }
  if (box) box.classList.remove("hidden");
}
function truncate(addr) {
  return addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
}
function statusBadge(status) {
  const label = STATUS_LABELS[status] ?? "Unknown";
  const color = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  return `<span class="px-2 py-1 rounded text-xs font-semibold ${color}">${label}</span>`;
}
function renderTimeline(status) {
  return STATUS_LABELS.map((label, i) => {
    const done   = i <= status;
    const active = i === status;
    return `
      <div class="flex items-center gap-3 mb-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
          ${done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}">
          ${done && !active ? "✓" : i + 1}
        </div>
        <div class="flex-1">
          <span class="${active ? "font-bold text-green-700" : done ? "text-gray-700" : "text-gray-400"}">
            ${label}
          </span>
          ${active ? '<span class="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Current</span>' : ""}
        </div>
      </div>`;
  }).join("");
}


