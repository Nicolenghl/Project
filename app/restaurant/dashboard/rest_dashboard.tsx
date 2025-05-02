'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';

enum SupplySource {
    LOCAL_PRODUCER = 0,
    IMPORTED_PRODUCER = 1,
    GREEN_PRODUCER = 2,
    OTHER = 3
}

interface Dish {
    id: number;
    name: string;
    mainComponent: string;
    carbonCredits: number;
    price: string;
    restaurant: string;
    isActive: boolean;
    isVerified: boolean;
}

interface RestaurantInfo {
    supplySource: SupplySource;
    supplyDetails: string;
    isRegistered: boolean;
}

export default function RestaurantDashboard() {
    const { contract, account, isConnected, connect, isRestaurant } = useWeb3();
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // New dish form state
    const [isAddingDish, setIsAddingDish] = useState(false);
    const [newDish, setNewDish] = useState({
        name: '',
        mainComponent: '',
        carbonCredits: 0,
        price: ''
    });

    // Edit dish form state
    const [editingDishId, setEditingDishId] = useState<number | null>(null);
    const [editDish, setEditDish] = useState({
        name: '',
        mainComponent: '',
        carbonCredits: 0,
        price: '',
        isActive: true
    });

    const fetchRestaurantData = async () => {
        if (!contract || !account) return;

        setLoading(true);
        setError('');

        try {
            console.log("Creating provider...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            console.log("Getting signer...");
            const signer = await provider.getSigner();

            // Create a fresh contract instance with the signer
            console.log("Creating contract instance...");
            const contractWithSigner = new ethers.Contract(
                contract.target,
                contract.interface,
                signer
            );

            // Check chain ID - this is important for debugging
            const network = await provider.getNetwork();
            console.log("Network chainId:", network.chainId.toString());

            // Basic check if restaurant is registered
            console.log("Checking if restaurant is registered...");
            try {
                const isVerified = await contractWithSigner.verifiedRestaurants(account);
                console.log("Restaurant verification status:", isVerified);

                if (!isVerified) {
                    setError('Restaurant not registered. Please register first.');
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Error checking verification:", err);
                setError("Failed to verify restaurant status. Please try again.");
                setLoading(false);
                return;
            }

            // Set minimal restaurant info to display something
            setRestaurantInfo({
                supplySource: SupplySource.LOCAL_PRODUCER, // Default value
                supplyDetails: "Details unavailable due to blockchain connection issues",
                isRegistered: true
            });

            // Try to get full restaurant info, but continue even if it fails
            try {
                console.log("Fetching restaurant info...");
                const info = await contractWithSigner.getRestaurantInfo(account);
                setRestaurantInfo({
                    supplySource: info.supplySource,
                    supplyDetails: info.supplyDetails,
                    isRegistered: true
                });
            } catch (err) {
                console.error("Failed to fetch restaurant details, using defaults:", err);
                // We already set default info above, so just continue
            }

            // Try to get dishes, but handle failure gracefully
            try {
                console.log("Fetching restaurant dishes...");
                const dishIds = await contractWithSigner.restaurantDishes(account);
                console.log("Dish IDs:", dishIds);

                if (dishIds && dishIds.length > 0) {
                    // Process a maximum of 5 dishes to avoid too many requests
                    const maxDishes = Math.min(dishIds.length, 5);
                    const processedDishes = [];

                    for (let i = 0; i < maxDishes; i++) {
                        try {
                            const id = dishIds[i];
                            console.log(`Fetching dish ${id} details...`);
                            const dishDetails = await contractWithSigner.getDishDetails(id);

                            processedDishes.push({
                                id: Number(id),
                                name: dishDetails.name,
                                mainComponent: dishDetails.mainComponent,
                                carbonCredits: Number(dishDetails.carbonCredits),
                                price: ethers.formatEther(dishDetails.price),
                                restaurant: dishDetails.restaurant,
                                isActive: dishDetails.isActive,
                                isVerified: dishDetails.isVerified
                            });
                        } catch (dishErr) {
                            console.error(`Error fetching dish ${dishIds[i]} details:`, dishErr);
                            // Continue with next dish
                        }
                    }

                    setDishes(processedDishes);
                } else {
                    setDishes([]);
                }
            } catch (dishesErr) {
                console.error("Failed to fetch dishes:", dishesErr);
                setDishes([]);
            }

        } catch (error) {
            console.error("Error in fetchRestaurantData:", error);

            if (error.code === -32603) {
                setError("MetaMask RPC Error: The blockchain node is having issues. Try switching networks or reconnecting.");
            } else if (error.message && error.message.includes("missing revert data")) {
                setError("Contract communication error. Your restaurant is registered, but detailed data cannot be retrieved at this time.");
            } else {
                setError(error.message || 'Failed to load restaurant data');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contract && account && isRestaurant) {
            fetchRestaurantData();
        } else {
            setLoading(false);
        }
    }, [contract, account, isRestaurant]);

    useEffect(() => {
        // Handle network changes
        const handleChainChanged = async () => {
            console.log("Network changed, refreshing...");
            window.location.reload();
        };

        const handleAccountsChanged = async (accounts) => {
            console.log("Accounts changed:", accounts);
            if (accounts.length === 0) {
                // User disconnected
                setDishes([]);
                setRestaurantInfo(null);
            } else {
                // User switched accounts
                window.location.reload();
            }
        };

        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('chainChanged', handleChainChanged);
            window.ethereum.on('accountsChanged', handleAccountsChanged);

            return () => {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, []);

    const handleAddDish = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contract || !account || !isRestaurant) {
            setError('You must be a registered restaurant to add dishes');
            return;
        }

        setLoading(true);
        setError('');

        // Verify chain connection first
        const isChainValid = await verifyChainConnection();
        if (!isChainValid) {
            setLoading(false);
            return;
        }

        try {
            // Convert price to wei - Fix for ethers v6
            const priceInWei = ethers.parseEther(newDish.price);

            console.log("Registering dish with params:", {
                name: newDish.name,
                mainComponent: newDish.mainComponent,
                carbonCredits: newDish.carbonCredits,
                price: priceInWei.toString()
            });

            // Create a fresh provider and signer for this transaction
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Create a fresh contract instance
            const contractWithSigner = new ethers.Contract(
                contract.target,
                contract.interface,
                signer
            );

            // Estimate gas with error handling
            const gasEstimate = await contractWithSigner.registerDish.estimateGas(
                newDish.name,
                newDish.mainComponent,
                newDish.carbonCredits,
                priceInWei
            ).catch(() => {
                // If estimation fails, use a safe default
                return 1500000; // Higher gas limit as fallback
            });

            // Add 20% buffer to gas estimate
            const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

            // Execute with our prepared values
            const tx = await contractWithSigner.registerDish(
                newDish.name,
                newDish.mainComponent,
                newDish.carbonCredits,
                priceInWei,
                { gasLimit }
            );

            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Transaction confirmed");

            // Reset form
            setNewDish({
                name: '',
                mainComponent: '',
                carbonCredits: 0,
                price: ''
            });

            setIsAddingDish(false);

            // Refresh dishes
            fetchRestaurantData();
        } catch (error: any) {
            console.error("Error adding dish:", error);

            if (error.code === 'ACTION_REJECTED') {
                setError('Transaction was rejected in your wallet');
            } else if (error.reason) {
                setError(`Contract error: ${error.reason}`);
            } else {
                setError(error.message || 'Failed to add dish');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditDish = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contract || !account || !isRestaurant || editingDishId === null) {
            return;
        }

        setLoading(true);
        setError('');

        // Verify chain connection first
        const isChainValid = await verifyChainConnection();
        if (!isChainValid) {
            setLoading(false);
            return;
        }

        try {
            // Fix for ethers v6
            const priceInWei = ethers.parseEther(editDish.price);

            console.log("Updating dish with params:", {
                dishId: editingDishId,
                price: priceInWei.toString(),
                isActive: editDish.isActive
            });

            // Create a fresh provider and signer for this transaction
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Create a fresh contract instance
            const contractWithSigner = new ethers.Contract(
                contract.target,
                contract.interface,
                signer
            );

            // Estimate gas with error handling
            const gasEstimate = await contractWithSigner.updateDish.estimateGas(
                editingDishId,
                priceInWei,
                editDish.isActive
            ).catch(() => {
                // If estimation fails, use a safe default
                return 750000;
            });

            // Add 20% buffer to gas estimate
            const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

            // Execute the transaction with our prepared values
            const tx = await contractWithSigner.updateDish(
                editingDishId,
                priceInWei,
                editDish.isActive,
                { gasLimit }
            );

            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Transaction confirmed");

            setEditingDishId(null);

            // Refresh dishes
            fetchRestaurantData();
        } catch (error: any) {
            console.error("Error updating dish:", error);

            if (error.code === 'ACTION_REJECTED') {
                setError('Transaction was rejected in your wallet');
            } else if (error.reason) {
                setError(`Contract error: ${error.reason}`);
            } else {
                setError(error.message || 'Failed to update dish');
            }
        } finally {
            setLoading(false);
        }
    };

    const startEditDish = (dish: Dish) => {
        setEditingDishId(dish.id);
        setEditDish({
            name: dish.name,
            mainComponent: dish.mainComponent,
            carbonCredits: dish.carbonCredits,
            price: dish.price,
            isActive: dish.isActive
        });
    };

    const getSupplySourceName = (source: SupplySource) => {
        switch (source) {
            case SupplySource.LOCAL_PRODUCER: return 'Local Producer';
            case SupplySource.IMPORTED_PRODUCER: return 'Imported Producer';
            case SupplySource.GREEN_PRODUCER: return 'Green Producer';
            case SupplySource.OTHER: return 'Other';
            default: return 'Unknown';
        }
    };

    const switchToCorrectNetwork = async () => {
        try {
            // Request network switch to the chain where your contract is deployed
            // Replace the chainId with the correct one for your contract
            // Common values: 1 (Ethereum Mainnet), 5 (Goerli Testnet), 11155111 (Sepolia), 31337 (Hardhat Local)
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x7A69' }], // 0x7A69 is hex for 31337 (Hardhat's default chainId)
            });

            // Refresh the page after switching
            window.location.reload();
        } catch (error) {
            console.error("Failed to switch network:", error);
            setError(`Failed to switch network: ${error.message}`);
        }
    };

    const handleResetConnection = async () => {
        try {
            setLoading(true);
            setError('');

            // Force MetaMask to reconnect
            if (window.ethereum) {
                await window.ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }]
                });
            }

            // Refresh the page to reset all state
            window.location.reload();
        } catch (error) {
            console.error("Reset error:", error);
            setError(`Reset failed: ${error.message}`);
            setLoading(false);
        }
    };

    const handleSwitchNetwork = async () => {
        try {
            setLoading(true);

            if (!window.ethereum) {
                throw new Error("MetaMask not detected");
            }

            // List of common networks to try
            const networks = [
                { chainId: '0x1', name: 'Ethereum Mainnet' },
                { chainId: '0x5', name: 'Goerli Testnet' },
                { chainId: '0xaa36a7', name: 'Sepolia Testnet' },
                { chainId: '0x7A69', name: 'Hardhat Local' },
                { chainId: '0x539', name: 'Localhost' }
            ];

            // Create dialog content with network options
            const message = "Select a network to switch to:";
            const networkOptions = networks.map(net =>
                `<button 
                    onclick="window.postMessage({type: 'SWITCH_NETWORK', chainId: '${net.chainId}'}, '*')" 
                    style="display:block; width:100%; margin:5px 0; padding:8px; background:#f0f0f0; border:1px solid #ccc; border-radius:4px;"
                >
                    ${net.name} (${net.chainId})
                </button>`
            ).join('');

            // Show a simple dialog with network options
            alert(`Please use MetaMask to switch networks manually. The contract may be deployed on a different network than you're currently connected to.`);

            setLoading(false);
        } catch (error) {
            console.error("Network switch error:", error);
            setError(`Failed to switch network: ${error.message}`);
            setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white shadow rounded-lg p-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
                        <p className="text-gray-600 mb-6">Please connect your wallet to access your restaurant dashboard.</p>
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

    if (!isRestaurant && !loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white shadow rounded-lg p-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Registered</h1>
                        <p className="text-gray-600 mb-6">Your account is not registered as a restaurant.</p>
                        <a
                            href="/restaurant/register"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded inline-block"
                        >
                            Register as Restaurant
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Restaurant Dashboard</h1>

                <div className="flex space-x-4">
                    <a
                        href="/restaurant/analytics"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                        View Analytics
                    </a>
                </div>

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
                        <div className="mt-3 flex justify-center space-x-3">
                            <button
                                onClick={handleResetConnection}
                                className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700"
                            >
                                Reset Connection
                            </button>
                            <button
                                onClick={handleSwitchNetwork}
                                className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                            >
                                Switch Network
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {/* Restaurant Info */}
                        {restaurantInfo && (
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Restaurant Information</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Supply Source</p>
                                            <p className="font-medium">{getSupplySourceName(restaurantInfo.supplySource)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Registration Status</p>
                                            <p className="font-medium">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Verified
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500">Supply Details</p>
                                        <p className="mt-1 text-gray-700">{restaurantInfo.supplyDetails}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dishes Section */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-lg font-medium text-gray-900">Your Dishes</h2>
                                <button
                                    onClick={() => setIsAddingDish(true)}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                >
                                    Add New Dish
                                </button>
                            </div>

                            <div className="p-6">
                                {dishes.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-500">You haven't added any dishes yet.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Dish
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Price
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Carbon Credits
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {dishes.map((dish) => (
                                                    <tr key={dish.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{dish.name}</div>
                                                            <div className="text-sm text-gray-500">{dish.mainComponent}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {dish.price} ETH
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {dish.carbonCredits}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${dish.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {dish.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => startEditDish(dish)}
                                                                className="text-green-600 hover:text-green-900"
                                                            >
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add Dish Form */}
                        {isAddingDish && (
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Add New Dish</h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingDish(false)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddDish}>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                    Dish Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    required
                                                    value={newDish.name}
                                                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="mainComponent" className="block text-sm font-medium text-gray-700">
                                                    Main Ingredient
                                                </label>
                                                <input
                                                    type="text"
                                                    id="mainComponent"
                                                    required
                                                    value={newDish.mainComponent}
                                                    onChange={(e) => setNewDish({ ...newDish, mainComponent: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="carbonCredits" className="block text-sm font-medium text-gray-700">
                                                    Carbon Credits (1-100)
                                                </label>
                                                <input
                                                    type="number"
                                                    id="carbonCredits"
                                                    min="1"
                                                    max="100"
                                                    required
                                                    value={newDish.carbonCredits}
                                                    onChange={(e) => setNewDish({ ...newDish, carbonCredits: parseInt(e.target.value) })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                                    Price (ETH)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="price"
                                                    pattern="[0-9]*\.?[0-9]+"
                                                    required
                                                    value={newDish.price}
                                                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                    placeholder="0.01"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingDish(false)}
                                                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                                            >
                                                {loading ? 'Processing...' : 'Add Dish'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Edit Dish Form */}
                        {editingDishId !== null && (
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Edit Dish</h3>
                                        <button
                                            type="button"
                                            onClick={() => setEditingDishId(null)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={handleEditDish}>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                                                    Dish Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="edit-name"
                                                    required
                                                    value={editDish.name}
                                                    onChange={(e) => setEditDish({ ...editDish, name: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="edit-mainComponent" className="block text-sm font-medium text-gray-700">
                                                    Main Ingredient
                                                </label>
                                                <input
                                                    type="text"
                                                    id="edit-mainComponent"
                                                    required
                                                    value={editDish.mainComponent}
                                                    onChange={(e) => setEditDish({ ...editDish, mainComponent: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="edit-carbonCredits" className="block text-sm font-medium text-gray-700">
                                                    Carbon Credits (1-100)
                                                </label>
                                                <input
                                                    type="number"
                                                    id="edit-carbonCredits"
                                                    min="1"
                                                    max="100"
                                                    required
                                                    value={editDish.carbonCredits}
                                                    onChange={(e) => setEditDish({ ...editDish, carbonCredits: parseInt(e.target.value) })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700">
                                                    Price (ETH)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="edit-price"
                                                    pattern="[0-9]*\.?[0-9]+"
                                                    required
                                                    value={editDish.price}
                                                    onChange={(e) => setEditDish({ ...editDish, price: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                />
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    id="edit-isActive"
                                                    name="isActive"
                                                    type="checkbox"
                                                    checked={editDish.isActive}
                                                    onChange={(e) => setEditDish({ ...editDish, isActive: e.target.checked })}
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="edit-isActive" className="ml-2 block text-sm text-gray-900">
                                                    Dish is active
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditingDishId(null)}
                                                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                                            >
                                                {loading ? 'Processing...' : 'Update Dish'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
} 