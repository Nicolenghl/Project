# GreenDish - Sustainable Dining Marketplace

GreenDish is a web3 application that connects eco-conscious diners with sustainable restaurants. Restaurants can register on the platform, list their sustainable dishes, and customers can purchase them while earning carbon credits and token rewards.

## Features

- **For Restaurants**:
  - Register as a verified sustainable restaurant
  - Manage dish listings (add, activate, deactivate)
  - Showcase sustainable practices and supply chain information

- **For Customers**:
  - Browse sustainable dishes in the marketplace
  - Purchase dishes using cryptocurrency (ETH)
  - Earn carbon credits and GreenCoin tokens
  - Track purchase history and token balance
  - Rate dishes and earn additional rewards

## Technology Stack

- Next.js 15 with TypeScript
- Tailwind CSS for styling
- Ethers.js for blockchain interaction
- Solidity for smart contracts
- Hardhat for development and testing

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask wallet extension

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/isom3270greendish.git
   cd isom3270greendish
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start a local Ethereum node:
   ```bash
   npx hardhat node
   ```

4. In a new terminal, deploy the smart contract:
   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   ```

5. Take note of the deployed contract address from the terminal output and update it in the `app/context/Web3Context.tsx` file:
   ```typescript
   const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
   ```

6. Start the development server:
```bash
npm run dev
# or
yarn dev
   ```

7. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Using the Application

### Connect Your Wallet

1. Install MetaMask browser extension if you haven't already
2. Connect to the local Hardhat network (localhost:8545, Chain ID: 1337)
3. Click "Connect Wallet" in the application to interact with the smart contract

### For Restaurants

1. Register your restaurant by clicking "Restaurant Sign-up"
2. Provide information about your sustainable practices and make a deposit
3. After registration, access your dashboard to add sustainable dishes
4. Manage your dish listings (activate/deactivate) as needed

### For Customers

1. Browse the marketplace to see all available sustainable dishes
2. Purchase dishes to earn carbon credits and GreenCoin tokens
3. Track your profile and purchase history
4. Rate dishes you've purchased

## Testing

Run tests for the smart contract:

```bash
npx hardhat test
```

## License

[MIT](LICENSE)

## Acknowledgements

This project was created as part of the ISOM3270 course.
