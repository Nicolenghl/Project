'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWeb3 } from '../context/Web3Context';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
    const { connect, disconnect, account, isConnected, isRestaurant } = useWeb3();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const truncateAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <nav className="bg-green-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold">GreenDish</span>
                        </Link>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-4">
                            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-800">
                                Home
                            </Link>
                            <Link href="/marketplace" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-800">
                                Marketplace
                            </Link>

                            {isConnected && (
                                <Link href="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-800">
                                    My Profile
                                </Link>
                            )}

                            {isConnected && isRestaurant && (
                                <Link href="/restaurant/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-800">
                                    Restaurant Dashboard
                                </Link>
                            )}

                            {!isConnected ? (
                                <button
                                    onClick={connect}
                                    className="ml-4 px-4 py-2 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700"
                                >
                                    Connect Wallet
                                </button>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm bg-green-800 px-3 py-1 rounded-full">
                                        {truncateAddress(account!)}
                                    </span>
                                    <button
                                        onClick={disconnect}
                                        className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-800 focus:outline-none"
                        >
                            {isMenuOpen ? (
                                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-800"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/marketplace"
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-800"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Marketplace
                        </Link>

                        {isConnected && (
                            <Link
                                href="/profile"
                                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-800"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                My Profile
                            </Link>
                        )}

                        {isConnected && isRestaurant && (
                            <Link
                                href="/restaurant/dashboard"
                                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-800"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Restaurant Dashboard
                            </Link>
                        )}

                        {!isConnected ? (
                            <button
                                onClick={() => {
                                    connect();
                                    setIsMenuOpen(false);
                                }}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-green-600 hover:bg-green-700"
                            >
                                Connect Wallet
                            </button>
                        ) : (
                            <div className="space-y-2 mt-2">
                                <span className="block text-sm bg-green-800 px-3 py-1 rounded-full">
                                    {truncateAddress(account!)}
                                </span>
                                <button
                                    onClick={() => {
                                        disconnect();
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-600 hover:bg-red-700"
                                >
                                    Disconnect
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
} 