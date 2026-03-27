import { createContext, useContext } from 'react';

// 1. Create the empty Cart Vault
export const CartContext = createContext({});

// 2. Create the custom hook to open the vault anywhere
export const useGlobalCart = () => useContext(CartContext);