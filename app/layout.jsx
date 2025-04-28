'use client';

import './globals.css';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Dynamically import Web3Provider with ssr disabled
const Web3ProviderNoSSR = dynamic(
    () => import("./context/Web3Context.js").then((mod) => mod.Web3Provider),
    { ssr: false }
);

export default function RootLayout({ children }) {
    const [isLoading, setIsLoading] = useState(true);

    // Show loading state briefly to ensure libraries have time to load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <html lang="en">
            <body>
                {isLoading ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        flexDirection: 'column'
                    }}>
                        <div style={{ marginBottom: '20px' }}>Loading Web3 libraries...</div>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '5px solid #f3f3f3',
                            borderTop: '5px solid #3498db',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
                    </div>
                ) : (
                    <Web3ProviderNoSSR>
                        {children}
                        <ToastContainer position="bottom-right" />
                    </Web3ProviderNoSSR>
                )}
            </body>
        </html>
    );
} 