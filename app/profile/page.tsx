'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

interface Transaction {
    dishId: number;
    timestamp: number;
    carbonCredits: number;
    price: string;
    dishName?: string; // Added after fetching dish details
}

export default function Profile() {
    const { contract, account, isConnected, connect } = useWeb3();
    const [carbonCredits, setCarbonCredits] = useState(0);
    const [tokenBalance, setTokenBalance] = useState('0');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUserData = async () => {
        if (!contract || !account) return;

        setLoading(true);
        setError('');

        try {
            // Fetch carbon credits
            const credits = await contract.getCustomerCarbonCredits();
            setCarbonCredits(Number(credits));

            // Fetch token balance
            const balance = await contract.getCustomerTokenBalance();
            setTokenBalance(ethers.utils.formatEther(balance));

            // Fetch transactions
            const transactionCount = await contract.userTransactionCount(account);
            if (transactionCount.toNumber() > 0) {
                const userTransactions = await contract.getUserTransactions(0, 100); // Get up to 100 transactions

                // For each transaction, fetch the dish details to get the name
                const transactionsWithDetails = await Promise.all(userTransactions.map(async (tx: any) => {
                    try {
                        const dishDetails = await contract.getDishDetails(tx.dishId);
                        return {
                            dishId: tx.dishId.toNumber(),
                            timestamp: tx.timestamp.toNumber(),
                            carbonCredits: tx.carbonCredits.toNumber(),
                            price: ethers.utils.formatEther(tx.price),
                            dishName: dishDetails.name
                        };
                    } catch (error) {
                        return {
                            dishId: tx.dishId.toNumber(),
                            timestamp: tx.timestamp.toNumber(),
                            carbonCredits: tx.carbonCredits.toNumber(),
                            price: ethers.utils.formatEther(tx.price),
                            dishName: `Dish #${tx.dishId.toNumber()}` // Fallback if dish details can't be fetched
                        };
                    }
                }));

                setTransactions(transactionsWithDetails);
            }
        } catch (error: any) {
            console.error("Error fetching user data:", error);
            setError(error.message || 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contract && account) {
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, [contract, account]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    if (!isConnected) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white shadow rounded-lg p-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
                        <p className="text-gray-600 mb-6">Please connect your wallet to view your profile information.</p>
                        <button
                            onClick={connect}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
                        >
                            Connect Wallet
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-red-700">{error}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                        {/* Stats Section */}
                        <div className="md:col-span-4 space-y-6">
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Your Wallet</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-gray-500 truncate mb-1">Connected Address</p>
                                    <p className="text-sm font-mono text-gray-700 truncate mb-4">{account}</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Carbon Credits</p>
                                            <p className="text-2xl font-bold text-green-700">{carbonCredits}</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">GreenCoins</p>
                                            <p className="text-2xl font-bold text-green-700">{parseFloat(tokenBalance).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Environmental Impact</h2>
                                </div>
                                <div className="p-6">
                                    {carbonCredits > 0 ? (
                                        <div>
                                            <div className="flex items-center mb-4">
                                                <svg className="h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <div>
                                                    <p className="text-gray-900 font-medium">You've made an impact!</p>
                                                    <p className="text-sm text-gray-500">
                                                        By choosing sustainable dishes, you've helped reduce carbon emissions.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-green-100 rounded-lg p-4">
                                                <p className="text-sm text-green-800">
                                                    Your sustainable choices have earned you <span className="font-bold">{carbonCredits}</span> carbon credits,
                                                    equivalent to approximately <span className="font-bold">{(carbonCredits * 0.1).toFixed(2)} kg</span> of CO₂ reduction.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500">
                                                Make your first sustainable purchase to see your environmental impact!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="md:col-span-8">
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
                                </div>
                                <div className="p-6">
                                    {transactions.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Dish
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Price
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Credits
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {transactions.map((tx, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {tx.dishName || `Dish #${tx.dishId}`}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(tx.timestamp)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {tx.price} ETH
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    +{tx.carbonCredits}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-500">No transactions found</p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Visit the <a href="/marketplace" className="text-green-600 hover:text-green-500">marketplace</a> to make your first sustainable purchase!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
} 