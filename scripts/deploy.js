const hre = require("hardhat");

async function main() {
    console.log("Deploying GreenDish contract...");

    // Initial configuration values
    const entryFee = hre.ethers.utils.parseEther("0.01"); // 0.01 ETH entry fee
    const initialSupply = 100000; // 100,000 GreenCoins (will be multiplied by 10^18)

    // Deploy the contract
    const GreenDish = await hre.ethers.getContractFactory("GreenDish");
    const greenDish = await GreenDish.deploy(entryFee, initialSupply);

    await greenDish.deployed();

    console.log("GreenDish deployed to:", greenDish.address);
    console.log("Entry fee set to:", hre.ethers.utils.formatEther(entryFee), "ETH");
    console.log("Initial token supply:", initialSupply, "GreenCoins");

    // Additional post-deployment actions can be placed here
    // For example, registering the first restaurant or adding initial dishes

    console.log("\nVerification command:");
    console.log(
        `npx hardhat verify --network ${hre.network.name} ${greenDish.address} ${entryFee} ${initialSupply}`
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 