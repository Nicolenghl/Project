'use client';

import React, { useState } from 'react';
import { testContractConnection, testSimpleRegistration } from './TestContract';

export default function TestPage() {
    const [testResults, setTestResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const runConnectionTest = async () => {
        setLoading(true);
        setError('');
        try {
            const results = await testContractConnection();
            setTestResults(results);
        } catch (err: any) {
            console.error('Test error:', err);
            setError(err.message || 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const runSimpleRegistration = async () => {
        setLoading(true);
        setError('');
        try {
            const results = await testSimpleRegistration();
            setTestResults(results);
        } catch (err: any) {
            console.error('Test error:', err);
            setError(err.message || 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Contract Test Page</h1>

            <div className="mb-8 space-y-4">
                <h2 className="text-xl font-semibold">Test Operations</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={runConnectionTest}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Testing...' : 'Test Contract Connection'}
                    </button>

                    <button
                        onClick={runSimpleRegistration}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        {loading ? 'Testing...' : 'Test Simple Registration'}
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded">
                        {error}
                    </div>
                )}
            </div>

            {testResults && (
                <div className="border rounded p-6 bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4">Test Results</h2>

                    <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${testResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {testResults.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                    </div>

                    {testResults.error && (
                        <div className="mb-4">
                            <h3 className="font-medium text-red-700">Error</h3>
                            <pre className="mt-2 p-3 bg-red-50 rounded text-sm overflow-auto">
                                {testResults.error}
                            </pre>
                        </div>
                    )}

                    {testResults.data && (
                        <div>
                            <h3 className="font-medium mb-2">Data</h3>
                            <pre className="p-3 bg-gray-100 rounded text-sm overflow-auto">
                                {JSON.stringify(testResults.data, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Debugging Tips</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Check that you're connected to the right network where the contract is deployed</li>
                    <li>Ensure you have sufficient ETH balance (10+ ETH needed for registration)</li>
                    <li>Check browser console (F12) for detailed error logs</li>
                    <li>Verify contract address is correct in app/contracts/abi.ts</li>
                    <li>Try using a different wallet or browser</li>
                </ul>
            </div>
        </div>
    );
} 