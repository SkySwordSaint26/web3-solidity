import "dotenv/config"
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";


const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
if (!MAINNET_RPC_URL) {
  throw new Error("MAINNET_RPC_URL is not set in .env")
}


const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: MAINNET_RPC_URL,
        blockNumber: 24012506
      },
      chainId: 31337
    },
    localhost: {
      forking: {
        url: MAINNET_RPC_URL,
        blockNumber: 24012506
      }
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts/"
  },
  mocha: {
    timeout: 40000,
  }
};

export default config;
