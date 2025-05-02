'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useWeb3 } from '../../context/Web3Context';
import { ethers, parseEther } from 'ethers';

enum SupplySource {
    LOCAL_PRODUCER = 0,
    IMPORTED_PRODUCER = 1,
    GREEN_PRODUCER = 2,
    OTHER = 3
}

export default function RegisterRestaurant() {
    const { contract, account, isConnected, connect, isRestaurant } = useWeb3();
    const [supplySource, setSupplySource] = useState<SupplySource>(SupplySource.LOCAL_PRODUCER);
    const [supplyDetails, setSupplyDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [depositAmount, setDepositAmount] = useState('10');
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if the restaurant is already registered
        if (contract && account && isRestaurant) {
            setRegistrationComplete(true);
        }
    }, [contract, account, isRestaurant]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contract || !account) {
            setError('Please connect your wallet first');
            return;
        }

        if (!supplyDetails.trim()) {
            setError('Please provide supply details');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Get network information to verify connection
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            console.log("Connected to network:", {
                chainId: network.chainId.toString(),
                name: network.name
            });

            // Check wallet balance
            const signer = await provider.getSigner();
            const balance = await provider.getBalance(await signer.getAddress());
            const balanceInEth = Number(ethers.formatEther(balance));
            console.log("Wallet balance:", balanceInEth, "ETH");

            // Check if balance is sufficient (10 ETH deposit + estimated gas)
            if (balanceInEth < 10.1) {
                setError(`Insufficient balance: You have ${balanceInEth.toFixed(2)} ETH but need at least 10.1 ETH (10 ETH deposit + gas)`);
                setLoading(false);
                return;
            }

            const depositInWei = parseEther(depositAmount);
            console.log("Registering restaurant with:", {
                supplySource,
                supplyDetails,
                value: depositInWei.toString()
            });

            // Create a fresh contract instance with signer to ensure proper connection
            const contractWithSigner = new ethers.Contract(
                contract.target,
                contract.interface,
                signer
            );

            // Get network information and chain ID
            const networkInfo = await provider.getNetwork();
            console.log("Connected to network:", {
                chainId: networkInfo.chainId.toString(),
                name: networkInfo.name
            });

            // Ensure we have the right gas settings
            const gasEstimate = await contractWithSigner.registerRestaurant.estimateGas(
                supplySource,
                supplyDetails,
                { value: depositInWei }
            ).catch(err => {
                // If gas estimation fails, use a safe default but log the error
                console.error("Gas estimation failed:", err);
                return 3000000; // Very high gas limit as fallback
            });

            console.log("Estimated gas:", gasEstimate.toString());

            // Add 20% buffer to gas estimate
            const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

            // Execute the transaction with more detailed logging
            console.log("Executing transaction with gas limit:", gasLimit);

            // Set max fee per gas and max priority fee per gas to ensure transaction goes through
            // On high congestion networks, these values might need adjustment
            const feeData = await provider.getFeeData();

            // Execute the transaction with specific parameters
            const tx = await contractWithSigner.registerRestaurant(
                supplySource,
                supplyDetails,
                {
                    value: depositInWei,
                    gasLimit: gasLimit,
                    maxFeePerGas: feeData.maxFeePerGas,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
                }
            );

            console.log("Transaction sent:", tx.hash);

            // Extend the transaction confirmation timeout to 2 minutes
            const receipt = await Promise.race([
                tx.wait(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Transaction confirmation timeout - the transaction might still complete. Check your wallet for status.")), 120000)
                )
            ]);

            console.log("Transaction confirmed:", receipt);
            setRegistrationComplete(true);
        } catch (txError) {
            console.error("Transaction error:", txError);

            // Detailed error handling
            if (txError.code === 'ACTION_REJECTED') {
                setError('Transaction was rejected by user');
            } else if (txError.code === 'INSUFFICIENT_FUNDS') {
                setError('Insufficient funds for transaction. Make sure you have enough ETH for gas fees plus the 10 ETH deposit.');
            } else if (txError.reason) {
                // Smart contract reverted with a reason
                setError(`Contract rejected transaction: ${txError.reason}`);
            } else if (txError.message && txError.message.includes('timeout')) {
                setError('Transaction confirmation timed out. The transaction might still be processing. Please check your wallet for status.');
            } else if (txError.message && txError.message.includes('user denied')) {
                setError('You denied the transaction in your wallet.');
            } else {
                // Fallback to a general error message but with technical details for debugging
                setError(`Transaction failed: ${txError.message || 'Unknown error'}. Check the console for technical details.`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Restaurant Registration</h1>
                        <p className="mt-2 text-lg text-gray-600">Join the GreenDish ecosystem and showcase your sustainable practices</p>
                    </div>

                    {!isConnected ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Your Wallet</h2>
                            <p className="text-gray-600 mb-6">
                                Please connect your wallet to register your restaurant.
                            </p>
                            <button
                                onClick={connect}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
                            >
                                Connect Wallet
                            </button>
                        </div>
                    ) : registrationComplete ? (
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <div className="text-center mb-4">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="mt-4 text-xl font-semibold text-gray-900">Registration Successful!</h2>
                                <p className="mt-2 text-gray-600">
                                    Your restaurant is now registered with GreenDish.
                                </p>
                            </div>

                            <div className="mt-6">
                                <a
                                    href="/restaurant/dashboard"
                                    className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center"
                                >
                                    Go to Restaurant Dashboard
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <form onSubmit={handleRegister}>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="supplySource" className="block text-sm font-medium text-gray-700">
                                            Supply Source
                                        </label>
                                        <select
                                            id="supplySource"
                                            value={supplySource}
                                            onChange={(e) => setSupplySource(Number(e.target.value) as SupplySource)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                                        >
                                            <option value={SupplySource.LOCAL_PRODUCER}>Local Producer</option>
                                            <option value={SupplySource.IMPORTED_PRODUCER}>Imported Producer</option>
                                            <option value={SupplySource.GREEN_PRODUCER}>Green Producer</option>
                                            <option value={SupplySource.OTHER}>Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="supplyDetails" className="block text-sm font-medium text-gray-700">
                                            Supply Details
                                        </label>
                                        <textarea
                                            id="supplyDetails"
                                            value={supplyDetails}
                                            onChange={(e) => setSupplyDetails(e.target.value)}
                                            rows={4}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            placeholder="Describe your supply chain, sustainability practices, and ingredient sourcing."
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700">
                                            Deposit Amount (ETH)
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <input
                                                type="text"
                                                id="depositAmount"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value)}
                                                className="focus:ring-green-500 focus:border-green-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                                                placeholder="10"
                                                disabled
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">ETH</span>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500">
                                            A deposit is required to register your restaurant. This helps ensure commitment to the platform.
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Register Restaurant'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Information Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">Why Join GreenDish?</h2>
                        <p className="mt-4 text-lg text-gray-500">
                            GreenDish connects eco-conscious diners with sustainable restaurants, creating a marketplace that rewards green practices.
                        </p>
                    </div>
                    <div className="mt-12">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="pt-6">
                                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                                    <div className="-mt-6">
                                        <div>
                                            <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </span>
                                        </div>
                                        <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Increase Revenue</h3>
                                        <p className="mt-5 text-base text-gray-500">
                                            Connect with eco-conscious diners actively seeking sustainable dining options.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                                    <div className="-mt-6">
                                        <div>
                                            <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                            </span>
                                        </div>
                                        <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Showcase Sustainability</h3>
                                        <p className="mt-5 text-base text-gray-500">
                                            Highlight your environmentally-friendly practices and sustainable supply chains.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                                    <div className="-mt-6">
                                        <div>
                                            <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </span>
                                        </div>
                                        <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Data-Driven Insights</h3>
                                        <p className="mt-5 text-base text-gray-500">
                                            Gain valuable feedback from customers and track the environmental impact of your menu.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
} 