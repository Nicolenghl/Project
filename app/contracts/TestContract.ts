'use client';

import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './abi';

/**
 * This is a diagnostic script to test contract functionality
 * Designed to be run in a browser console or as a separate page
 */

export const testContractConnection = async () => {
    try {
        console.log('Starting contract connection test...');
        console.log('Contract address:', CONTRACT_ADDRESS);

        // Check if window.ethereum exists
        if (!window.ethereum) {
            console.error('MetaMask not detected - please install MetaMask to use this application');
            return {
                success: false,
                error: 'MetaMask not detected'
            };
        }

        // Request accounts
        console.log('Requesting accounts...');
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
            console.error('No accounts found. Make sure MetaMask is unlocked.');
            return {
                success: false,
                error: 'No accounts detected'
            };
        }

        const account = accounts[0];
        console.log('Connected account:', account);

        // Get network information
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        console.log('Connected to network:', {
            chainId: network.chainId.toString(),
            name: network.name
        });

        // Check balance
        const balance = await provider.getBalance(account);
        const balanceInEth = ethers.formatEther(balance);
        console.log('Account balance:', balanceInEth, 'ETH');

        // Create contract instance
        console.log('Creating contract instance...');
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Test read-only functions to check connection
        console.log('Testing read operations...');
        try {
            const isVerified = await contract.verifiedRestaurants(account);
            console.log('Restaurant verification status:', isVerified);

            const restaurantDeposit = await contract.restaurantDeposit();
            console.log('Required deposit:', ethers.formatEther(restaurantDeposit), 'ETH');

            // Try a simple read function
            const ownerAddress = await contract.owner();
            console.log('Contract owner:', ownerAddress);

            return {
                success: true,
                data: {
                    account,
                    network: network.name,
                    chainId: network.chainId.toString(),
                    balance: balanceInEth,
                    isVerified,
                    requiredDeposit: ethers.formatEther(restaurantDeposit)
                }
            };
        } catch (readError) {
            console.error('Error reading contract data:', readError);
            return {
                success: false,
                error: `Contract read operations failed: ${readError.message}`
            };
        }
    } catch (error) {
        console.error('Test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Function to test a much simpler registration
export const testSimpleRegistration = async () => {
    try {
        // Create provider and contract
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        console.log('Testing simple registration...');

        // Get the deposit amount required by the contract
        const requiredDeposit = await contract.restaurantDeposit();
        console.log('Required deposit:', ethers.formatEther(requiredDeposit), 'ETH');

        // Create a minimal transaction
        const tx = await contract.registerRestaurant(
            0, // SupplySource.LOCAL_PRODUCER
            "Test restaurant supply details", // Minimal valid string
            {
                value: requiredDeposit,
                gasLimit: 1000000
            }
        );

        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        return {
            success: true,
            data: {
                txHash: tx.hash
            }
        };
    } catch (error) {
        console.error('Simple registration test failed:', error);

        // Log additional diagnostic info
        if (error.code) {
            console.error('Error code:', error.code);
        }
        if (error.reason) {
            console.error('Error reason:', error.reason);
        }
        if (error.method) {
            console.error('Failed method:', error.method);
        }
        if (error.transaction) {
            console.error('Transaction details:', {
                from: error.transaction.from,
                to: error.transaction.to,
                value: error.transaction.value,
                data: error.transaction.data
            });
        }

        return {
            success: false,
            error: error.message
        };
    }
}; 