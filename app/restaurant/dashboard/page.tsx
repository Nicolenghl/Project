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
            // Check if restaurant is registered
            const isVerified = await contract.verifiedRestaurants(account);

            if (!isVerified) {
                setError('Restaurant not registered. Please register first.');
                setLoading(false);
                return;
            }

            // Fetch restaurant info
            const info = await contract.getRestaurantInfo(account);
            setRestaurantInfo({
                supplySource: info.supplySource,
                supplyDetails: info.supplyDetails,
                isRegistered: info.isRegistered
            });

            // Fetch restaurant dishes
            const dishIds = await contract.restaurantDishes(account);

            if (dishIds && dishIds.length > 0) {
                const dishPromises = dishIds.map(async (id: ethers.BigNumber) => {
                    const dishDetails = await contract.getDishDetails(id);
                return {
                        id: id.toNumber(),
                    name: dishDetails.name,
                    mainComponent: dishDetails.mainComponent,
                        carbonCredits: dishDetails.carbonCredits.toNumber(),
                    price: ethers.utils.formatEther(dishDetails.price),
                    restaurant: dishDetails.restaurant,
                        isActive: dishDetails.isActive,
                        isVerified: dishDetails.isVerified
                };
            });

                const dishesData = await Promise.all(dishPromises);
                setDishes(dishesData);
            }
        } catch (error: any) {
            console.error("Error fetching restaurant data:", error);
            setError(error.message || 'Failed to load restaurant data');
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

    const handleAddDish = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contract || !account || !isRestaurant) {
            setError('You must be a registered restaurant to add dishes');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const tx = await contract.registerDish(
                newDish.name,
                newDish.mainComponent,
                newDish.carbonCredits,
                ethers.utils.parseEther(newDish.price)
            );

            await tx.wait();

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
            setError(error.message || 'Failed to add dish');
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

        try {
            const tx = await contract.updateDish(
                editingDishId,
                editDish.name,
                editDish.mainComponent,
                editDish.carbonCredits,
                ethers.utils.parseEther(editDish.price),
                editDish.isActive,
                restaurantInfo?.supplySource || 0,
                restaurantInfo?.supplyDetails || ''
            );

            await tx.wait();

            setEditingDishId(null);

            // Refresh dishes
            fetchRestaurantData();
        } catch (error: any) {
            console.error("Error updating dish:", error);
            setError(error.message || 'Failed to update dish');
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