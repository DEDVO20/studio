'use client';

import { useState, useEffect } from 'react';

const defaultPaymentMethods = ['Efectivo', 'Tarjeta de Crédito/Débito', 'Transferencia Bancaria', 'Nequi', 'Daviplata'];

export function usePaymentMethods(): string[] {
    const [methods, setMethods] = useState<string[]>(defaultPaymentMethods);

    useEffect(() => {
        // This code runs only on the client, after the component has mounted.
        try {
            const storedMethods = localStorage.getItem('paymentMethods');
            if (storedMethods) {
                // The stored value is a JSON string of a single string with newlines.
                const parsedString: string = JSON.parse(storedMethods);
                const methodArray = parsedString.split('\n').filter(m => m.trim() !== '');
                setMethods(methodArray.length > 0 ? methodArray : defaultPaymentMethods);
            }
        } catch (error) {
            console.error("Could not parse payment methods from localStorage", error);
            // Fallback to default settings if there's an error
            setMethods(defaultPaymentMethods);
        }
    }, []);

    return methods;
}
