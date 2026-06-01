# 🏥 PharmaChain – Pharmaceutical Supply Chain DApp

A blockchain-based medicine tracking system on Ethereum Hoodi Testnet.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pharma_dapp
HOODI_RPC_URL=https://rpc.hoodi.ethpandaops.io
PRIVATE_KEY=your_wallet_private_key_here
CONTRACT_ADDRESS=   # Fill after deployment
```

### 3. Compile Smart Contract
```bash
npx hardhat compile
```

### 4. Deploy to Hoodi Testnet
```bash
npx hardhat ignition deploy ./ignition/modules/Pharma.ts --network hoodi
```
Copy the deployed contract address into `.env` as `CONTRACT_ADDRESS`.

### 5. Run the App
```bash
npm start
# or for development with auto-reload:
npm run dev
```
Open http://localhost:3000

---

## 🗂 Project Structure

```
pharma-dapp/
├── contracts/Pharma.sol          # Solidity smart contract
├── ignition/modules/Pharma.ts    # Deployment module
├── public/
│   ├── ui.js                     # Frontend blockchain logic (ethers.js)
│   ├── PharmaABI.json            # Contract ABI
│   └── qr/                       # Generated QR codes
├── src/
│   ├── app.js                    # Express server
│   ├── routes/
│   │   ├── api.js                # API routes (MongoDB + QR)
│   │   └── ui.js                 # Page routes
│   └── views/                    # EJS templates
│       ├── _nav.ejs
│       ├── _loading.ejs
│       ├── home.ejs
│       ├── add.ejs
│       ├── transfer.ejs
│       ├── distributor.ejs
│       ├── pharmacy.ejs
│       ├── track.ejs
│       ├── verify.ejs
│       └── events.ejs
├── hardhat.config.js
├── package.json
└── .env
```

---

## 🌐 Pages

| URL | Description |
|-----|-------------|
| `/` | Home dashboard with stats and live events |
| `/add` | Manufacturer adds medicine to blockchain |
| `/distributor` | Distributor assigns themselves and confirms receipt |
| `/pharmacy` | Pharmacy assigns themselves, marks available, sells |
| `/track` | Search and track any medicine by ID |
| `/verify` | QR scanner for customer verification |
| `/events` | All blockchain event history |
| `/transfer` | Links to distributor/pharmacy pages |

---

## 🔗 Medicine Lifecycle

```
Manufactured → Shipped to Distributor → Received by Distributor
             → Sent to Pharmacy → Available at Pharmacy → Sold
```

---

## ⚙️ MetaMask Setup for Hoodi

Add Hoodi Testnet to MetaMask:
- Network Name: Hoodi Testnet
- RPC URL: https://rpc.hoodi.ethpandaops.io
- Chain ID: 560048
- Symbol: ETH
- Block Explorer: https://hoodi.etherscan.io

Get testnet ETH: https://hoodi-faucet.pk910.de

---

## 📦 After Deployment

After running `npx hardhat ignition deploy`, copy the output contract address and paste it in `.env`:
```
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```
Then restart the server.

---

## 🛠 VS Code Tips

1. Install extensions: Solidity (Juan Blanco), ESLint
2. Use Terminal → New Terminal → `npm run dev`
3. Use the Hardhat extension for contract debugging
