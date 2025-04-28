'use client';

/**
 * Simplified Web3Context to avoid compilation errors
 */

function createContext(defaultValue) {
    return {
        Provider: function ({ value, children }) {
            return children;
        }
    };
}

function useContext(context) {
    return {
        connect: async () => { },
        disconnect: () => { },
        account: null,
        contract: null,
        isConnected: false,
        isRestaurant: false,
        loading: false
    };
}

// Create context
const Web3Context = createContext({
    connect: async () => { },
    disconnect: () => { },
    account: null,
    contract: null,
    isConnected: false,
    isRestaurant: false,
    loading: false
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }) {
    return Web3Context.Provider({
        value: {
            connect: async () => { },
            disconnect: () => { },
            account: null,
            contract: null,
            isConnected: false,
            isRestaurant: false,
            loading: false
        },
        children
    });
} 