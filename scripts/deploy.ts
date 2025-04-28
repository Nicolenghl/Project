import { ethers } from "hardhat";

async function main() {
    console.log("Starting deployment of GreenDish contract...");

    // Deploy with constructor arguments: entryFee (0.01 ETH) and initialSupply (100,000 tokens)
    const entryFee = ethers.utils.parseEther("0.01");
    const initialSupply = 100000; // 100,000 tokens

    // Get the contract factory
    const GreenDish = await ethers.getContractFactory("GreenDish");

    // Deploy the contract
    const greenDish = await GreenDish.deploy(entryFee, initialSupply);

    // Wait for the contract to be deployed
    await greenDish.deployed();

    console.log("GreenDish deployed to:", greenDish.address);

    // Add this contract address to your Web3Context file (replace placeholder)
    console.log("Update your CONTRACT_ADDRESS in Web3Context.tsx to:", greenDish.address);
}

// We recommend this pattern to be able to use async/await everywhere
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 