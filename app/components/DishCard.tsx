'use client';

import React, { useState } from 'react';
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

interface DishCardProps {
    dish: Dish;
    onPurchase: () => void;
}

const DishCard: React.FC<DishCardProps> = ({ dish, onPurchase }) => {
    const { contract, account, isConnected } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [showRating, setShowRating] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [dishRating, setDishRating] = useState<{ average: number, count: number }>({ average: 0, count: 0 });
    const [error, setError] = useState('');

    const fetchDishRating = async () => {
        if (!contract) return;

        try {
            const ratingData = await contract.getDishRating(dish.id);
            setDishRating({
                average: ratingData[0].toNumber(),
                count: ratingData[1].toNumber()
            });
        } catch (error) {
            console.error("Error fetching dish rating:", error);
        }
    };

    React.useEffect(() => {
        if (contract && dish.id) {
            fetchDishRating();
        }
    }, [contract, dish.id]);

    const handlePurchase = async () => {
        if (!contract || !account) return;

        setLoading(true);
        setError('');

        try {
            const priceInWei = ethers.utils.parseEther(dish.price);
            const tx = await contract.purchaseDishWithEth(dish.id, { value: priceInWei });
            await tx.wait();
            setPurchaseSuccess(true);
            onPurchase();
        } catch (error: any) {
            console.error("Error purchasing dish:", error);
            setError(error.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRating = async () => {
        if (!contract || !account) return;

        setLoading(true);
        setError('');

        try {
            const tx = await contract.rateDish(dish.id, rating, comment);
            await tx.wait();
            setShowRating(false);
            fetchDishRating();
        } catch (error: any) {
            console.error("Error rating dish:", error);
            setError(error.message || 'Rating failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">{dish.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Main ingredient: {dish.mainComponent}</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {dish.carbonCredits} carbon credits
                    </div>
                </div>

                <div className="mt-4 flex items-center">
                    <span className="text-lg font-bold text-gray-900">{dish.price} ETH</span>

                    {dishRating.count > 0 && (
                        <div className="ml-auto flex items-center">
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="ml-1 text-sm text-gray-600">{dishRating.average} ({dishRating.count})</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                <div className="mt-6">
                    {isConnected ? (
                        purchaseSuccess ? (
                            <div className="flex justify-between">
                                <span className="text-green-600 font-medium">Successfully purchased!</span>
                                <button
                                    onClick={() => setShowRating(true)}
                                    className="text-sm font-medium text-green-600 hover:text-green-500"
                                >
                                    Rate dish
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handlePurchase}
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Purchase Dish'}
                            </button>
                        )
                    ) : (
                        <p className="text-sm text-gray-500 text-center">Connect wallet to purchase</p>
                    )}
                </div>

                {showRating && (
                    <div className="mt-4">
                        <h4 className="text-md font-medium mb-2">Rate this dish</h4>
                        <div className="flex mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    <svg fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                    </svg>
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this dish..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={3}
                        />
                        <div className="mt-2 flex justify-end space-x-2">
                            <button
                                onClick={() => setShowRating(false)}
                                className="text-gray-600 font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRating}
                                disabled={loading || rating === 0}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                            >
                                Submit Rating
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DishCard; 