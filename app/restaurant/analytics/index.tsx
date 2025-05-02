'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';

interface DishAnalytics {
    dishId: number;
    name: string;
    totalPurchases: number;
    averageRating: number;
    totalRatings: number;
    carbonCreditsGenerated: number;
}

export default function RestaurantAnalytics() {
    const { contract, account, isConnected, connect, isRestaurant } = useWeb3();
    const [dishesAnalytics, setDishesAnalytics] = useState<DishAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalCarbonImpact, setTotalCarbonImpact] = useState(0);

    useEffect(() => {
        if (contract && account && isRestaurant) {
            fetchAnalyticsData();
        } else {
            setLoading(false);
        }
    }, [contract, account, isRestaurant]);

    const fetchAnalyticsData = async () => {
        if (!contract || !account) return;

        setLoading(true);
        setError('');

        try {
            // 1. Get all dishes from the restaurant
            const dishIds = await contract.restaurantDishes(account);

            if (!dishIds || dishIds.length === 0) {
                setDishesAnalytics([]);
                setLoading(false);
                return;
            }

            // 2. For each dish, get details and analytics
            const analyticsPromises = dishIds.map(async (id) => {
                // Get basic dish details
                const dishDetails = await contract.getDishDetails(id);

                // Get rating information
                const [averageRating, totalRatings, ratingWithDecimal] = await contract.getDishRating(id);

                // For this demo, we'll simulate purchase count as we don't have a direct function
                // In a real implementation, you'd query transaction events or have a specific function

                // Convert BigInt values properly for ethers v6
                const dishId = Number(id);
                const carbonCredits = Number(dishDetails.carbonCredits);

                // Simulate purchase count based on ratings (in real app, would come from contract)
                const totalPurchases = totalRatings * 2; // Assumption: about half of purchases get rated

                // Calculate carbon impact (credits * purchases)
                const carbonCreditsGenerated = carbonCredits * totalPurchases;

                return {
                    dishId,
                    name: dishDetails.name,
                    totalPurchases,
                    averageRating: Number(averageRating),
                    totalRatings: Number(totalRatings),
                    carbonCreditsGenerated
                };
            });

            const analyticsData = await Promise.all(analyticsPromises);
            setDishesAnalytics(analyticsData);

            // Calculate total carbon impact
            const totalImpact = analyticsData.reduce(
                (sum, dish) => sum + dish.carbonCreditsGenerated,
                0
            );
            setTotalCarbonImpact(totalImpact);

        } catch (error) {
            console.error("Error fetching analytics data:", error);
            setError('Failed to load analytics data');
        } finally {
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
                        <p className="text-gray-600 mb-6">Please connect your wallet to view analytics.</p>
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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Restaurant Analytics</h1>
                    <div className="flex space-x-4">
                        <a
                            href="/restaurant/dashboard"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                        >
                            Dashboard
                        </a>
                    </div>
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
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-sm font-medium text-gray-500 truncate">Total Dishes</h2>
                                <p className="mt-1 text-3xl font-semibold text-gray-900">{dishesAnalytics.length}</p>
                            </div>

                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-sm font-medium text-gray-500 truncate">Total Purchases</h2>
                                <p className="mt-1 text-3xl font-semibold text-gray-900">
                                    {dishesAnalytics.reduce((sum, dish) => sum + dish.totalPurchases, 0)}
                                </p>
                            </div>

                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-sm font-medium text-gray-500 truncate">Carbon Impact</h2>
                                <p className="mt-1 text-3xl font-semibold text-gray-900">{totalCarbonImpact}</p>
                                <p className="text-sm text-gray-500">Carbon credits generated</p>
                            </div>
                        </div>

                        {/* Dishes Analytics Table */}
                        {dishesAnalytics.length > 0 ? (
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Dish Performance</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Dish
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Purchases
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Rating
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Carbon Impact
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {dishesAnalytics.map((dish) => (
                                                <tr key={dish.dishId}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {dish.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {dish.totalPurchases}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex items-center">
                                                                {[0, 1, 2, 3, 4].map((rating) => (
                                                                    <svg
                                                                        key={rating}
                                                                        className={`h-5 w-5 ${rating < dish.averageRating
                                                                            ? 'text-yellow-400'
                                                                            : 'text-gray-200'
                                                                            }`}
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 20 20"
                                                                        fill="currentColor"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <span className="ml-2 text-sm text-gray-500">
                                                                ({dish.totalRatings} reviews)
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {dish.carbonCreditsGenerated} credits
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white shadow rounded-lg p-8 text-center">
                                <p className="text-gray-500">No dishes found. Add dishes to see analytics.</p>
                                <a
                                    href="/restaurant/dashboard"
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                >
                                    Add Dishes
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
