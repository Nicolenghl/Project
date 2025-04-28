import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
    solidity: "0.8.19",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        hardhat: {
            // Allows MetaMask to connect to Hardhat Network
            chainId: 1337,
        },
        // Add other networks as needed (e.g., testnets, mainnet)
    },
    paths: {
        artifacts: "./app/artifacts",
    },
};

export default config;