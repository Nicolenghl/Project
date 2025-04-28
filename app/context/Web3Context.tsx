'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/abi';

// Add type definitions for Window ethereum
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, listener: (...args: any[]) => void) => void;
            removeListener: (event: string, listener: (...args: any[]) => void) => void;
        };
    }
}

// Declare types for the context
type Web3ContextType = {
    connect: () => Promise<void>;
    disconnect: () => void;
    account: string | null;
    contract: any | null;
    isConnected: boolean;
    isRestaurant: boolean;
    loading: boolean;
};

// Create context with default values
const Web3Context = createContext<Web3ContextType>({
    connect: async () => { },
    disconnect: () => { },
    account: null,
    contract: null,
    isConnected: false,
    isRestaurant: false,
    loading: false
});

export const useWeb3 = () => useContext(Web3Context);


export function Web3Provider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [contract, setContract] = useState<any | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isRestaurant, setIsRestaurant] = useState(false);
    const [loading, setLoading] = useState(false);

    const connect = async () => {
        // Only run in browser environment
        if (typeof window === 'undefined') return;

        // Check if MetaMask is installed
        if (!window.ethereum) {
            alert('Please install MetaMask to use this application');
            return;
        }

        try {
            setLoading(true);
            console.log("Connecting to wallet...");

            // Request accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found. Make sure MetaMask is unlocked.");
            }

            const connectedAccount = accounts[0];
            console.log("Connected account:", connectedAccount);

            // Create provider
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = provider.getSigner();

            // Create contract instance
            try {
                const contractInstance = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    signer
                );

                setContract(contractInstance);

                // Check if user is a restaurant
                try {
                    const restaurantStatus = await contractInstance.verifiedRestaurants(connectedAccount);
                    setIsRestaurant(restaurantStatus);
                    console.log("Restaurant status:", restaurantStatus);
                } catch (err) {
                    console.error("Error checking restaurant status:", err);
                    setIsRestaurant(false);
                }
            } catch (err) {
                console.error("Error creating contract instance:", err);
            }

            // Update state
            setAccount(connectedAccount);
            setIsConnected(true);

            // Set up event listeners
            const handleAccountsChanged = (newAccounts: string[]) => {
                console.log("Accounts changed:", newAccounts);
                if (newAccounts.length === 0) {
                    // User disconnected account
                    disconnect();
                } else {
                    // User switched account
                    setAccount(newAccounts[0]);
                }
            };

            const handleChainChanged = () => {
                console.log("Network changed, reloading...");
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Cleanup function to remove listeners
            return () => {
                window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum?.removeListener('chainChanged', handleChainChanged);
            };

        } catch (error) {
            console.error("Wallet connection error:", error);
            alert(`Failed to connect wallet: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const disconnect = () => {
        console.log("Disconnecting wallet...");
        setAccount(null);
        setContract(null);
        setIsConnected(false);
        setIsRestaurant(false);
    };

    // Auto-connect if previously connected
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            const checkConnection = async () => {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        await connect();
                    }
                } catch (error) {
                    console.error("Auto-connect error:", error);
                }
            };

            checkConnection();
        }
    }, []);

    return (
        <Web3Context.Provider
            value={{
                connect,
                disconnect,
                account,
                contract,
                isConnected,
                isRestaurant,
                loading
            }}
        >
            {children}
        </Web3Context.Provider>
    );
}
