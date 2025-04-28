'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DishCard from '../components/DishCard';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

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

export default function Marketplace() {
    const { contract, isConnected } = useWeb3();
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'highest-credits', 'lowest-credits'

    const fetchDishes = async () => {
        if (!contract) return;

        setLoading(true);
        setError('');

        try {
            const dishIds = await contract.getDishes();
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
            setDishes(dishesData.filter(dish => dish.isActive));
        } catch (error: any) {
            console.error("Error fetching dishes:", error);
            setError('Failed to load dishes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contract) {
            fetchDishes();
        }
    }, [contract]);

    const handlePurchase = () => {
        // Refresh dishes to get updated state
        fetchDishes();
    };

    const filteredDishes = () => {
        switch (filter) {
            case 'highest-credits':
                return [...dishes].sort((a, b) => b.carbonCredits - a.carbonCredits);
            case 'lowest-credits':
                return [...dishes].sort((a, b) => a.carbonCredits - b.carbonCredits);
            case 'highest-price':
                return [...dishes].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            case 'lowest-price':
                return [...dishes].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            default:
                return dishes;
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900">Sustainable Dish Marketplace</h1>
                    <p className="mt-4 text-lg text-gray-600">Browse and purchase eco-friendly dishes from verified restaurants</p>
                </div>

                {!isConnected && (
                    <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-yellow-700">Connect your wallet to purchase dishes and earn rewards</p>
                    </div>
                )}

                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <div className="mb-4 sm:mb-0">
                            <h2 className="text-xl font-semibold text-gray-800">{dishes.length} Dishes Available</h2>
                        </div>

                        <div className="flex items-center space-x-2">
                            <label htmlFor="filter" className="text-sm font-medium text-gray-700">Filter:</label>
                            <select
                                id="filter"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="border border-gray-300 rounded-md py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">All Dishes</option>
                                <option value="highest-credits">Highest Carbon Credits</option>
                                <option value="lowest-credits">Lowest Carbon Credits</option>
                                <option value="highest-price">Highest Price</option>
                                <option value="lowest-price">Lowest Price</option>
                            </select>
                        </div>
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
                ) : dishes.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No dishes available</h3>
                        <p className="text-gray-600">Check back later for new sustainable dishes.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDishes().map((dish) => (
                            <DishCard
                                key={dish.id}
                                dish={dish}
                                onPurchase={handlePurchase}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">How It Works</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Eat sustainably, earn rewards
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                            GreenDish helps you make eco-conscious dining choices while earning GreenCoins.
                        </p>
                    </div>

                    <div className="mt-10">
                        <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                            <div className="relative">
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-600 text-white">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                </div>
                                <div className="ml-16">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Purchase Sustainable Dishes</h3>
                                    <p className="mt-2 text-base text-gray-500">
                                        Browse dishes with transparency about their carbon footprint and sustainable ingredients.
                                    </p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-600 text-white">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-16">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Earn GreenCoins</h3>
                                    <p className="mt-2 text-base text-gray-500">
                                        Get rewarded with GreenCoins for every eco-friendly purchase you make.
                                    </p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-600 text-white">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <div className="ml-16">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Rate & Share</h3>
                                    <p className="mt-2 text-base text-gray-500">
                                        Rate dishes after your purchase and earn additional rewards for your feedback.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
} 