require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hoodi: {
      url: process.env.HOODI_RPC_URL || "https://eth-hoodi.g.alchemy.com/v2/UiCANatOqd8nWW5f791tf",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 560048,
    },
  },
};
