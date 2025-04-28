'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { createContext, useContext } from 'react';

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

// Replace with your actual deployed contract address
const CONTRACT_ADDRESS = '0x4C111d82caa78dD55eBbd89CE1D4CdE777Ae27E5';

// Full contract ABI
const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_entryFee",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_initialSupply",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "dishId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "customer",
                "type": "address"
            }
        ],
        "name": "DishPurchased",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "dishId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "customer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "score",
                "type": "uint256"
            }
        ],
        "name": "DishRated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "dishId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "restaurant",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            }
        ],
        "name": "DishRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "dishId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "restaurant",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "enum GreenDish.SupplySource",
                "name": "supplySource",
                "type": "uint8"
            }
        ],
        "name": "DishUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_dishId",
                "type": "uint256"
            }
        ],
        "name": "purchaseDishWithEth",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_dishId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_score",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_comment",
                "type": "string"
            }
        ],
        "name": "rateDish",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "dishId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "customer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "reward",
                "type": "uint256"
            }
        ],
        "name": "RatingRewarded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_mainComponent",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_carbonCredits",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_price",
                "type": "uint256"
            }
        ],
        "name": "registerDish",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum GreenDish.SupplySource",
                "name": "_supplySource",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "_supplyDetails",
                "type": "string"
            }
        ],
        "name": "registerRestaurant",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "restaurant",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "enum GreenDish.SupplySource",
                "name": "supplySource",
                "type": "uint8"
            }
        ],
        "name": "RestaurantRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "customer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "RewardIssued",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_entryFee",
                "type": "uint256"
            }
        ],
        "name": "setEntryFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_dishId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_mainComponent",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_carbonCredits",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_price",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "_isActive",
                "type": "bool"
            },
            {
                "internalType": "enum GreenDish.SupplySource",
                "name": "_supplySource",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "_supplyDetails",
                "type": "string"
            }
        ],
        "name": "updateDish",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "withdrawEth",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "allowances",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "balances",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "customerCarbonCredits",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "dishCounter",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "dishes",
        "outputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "mainComponent",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "carbonCredits",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "restaurant",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isVerified",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "dishRatings",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "totalRatings",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "ratingSum",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "rewardedRatings",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "entryFee",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCustomerCarbonCredits",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCustomerProfile",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "totalCarbonCredits",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "transactionCount",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct GreenDish.CustomerProfile",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCustomerTokenBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_dishId",
                "type": "uint256"
            }
        ],
        "name": "getDishDetails",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "mainComponent",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "carbonCredits",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "restaurant",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "isVerified",
                        "type": "bool"
                    }
                ],
                "internalType": "struct GreenDish.Dish",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getDishes",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_dishId",
                "type": "uint256"
            }
        ],
        "name": "getDishRating",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_restaurant",
                "type": "address"
            }
        ],
        "name": "getRestaurantInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "enum GreenDish.SupplySource",
                        "name": "supplySource",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "supplyDetails",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "isRegistered",
                        "type": "bool"
                    }
                ],
                "internalType": "struct GreenDish.RestaurantInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_dishId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            }
        ],
        "name": "getUserRating",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "score",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "comment",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "rewarded",
                        "type": "bool"
                    }
                ],
                "internalType": "struct GreenDish.Rating",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "startIndex",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "count",
                "type": "uint256"
            }
        ],
        "name": "getUserTransactions",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "dishId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "carbonCredits",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct GreenDish.Transaction[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MAX_SUPPLY",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "purchasedDishes",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "restaurantDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "restaurantDeposits",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "restaurantDishes",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "restaurantInfo",
        "outputs": [
            {
                "internalType": "enum GreenDish.SupplySource",
                "name": "supplySource",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "supplyDetails",
                "type": "string"
            },
            {
                "internalType": "bool",
                "name": "isRegistered",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "userRatings",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "score",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "comment",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "rewarded",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "userTransactionCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "userTransactions",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "dishId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "carbonCredits",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "verifiedRestaurants",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

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

            // Dynamically import ethers
            const ethers = await import('ethers');

            // Create provider
            const provider = new ethers.providers.Web3Provider(window.ethereum);
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
