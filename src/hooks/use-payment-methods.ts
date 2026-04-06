'use client';

import { useEffect, useState } from 'react';

import { defaultPaymentMethods as apiDefaultPaymentMethods } from '@/lib/app-settings';

export function usePaymentMethods(): string[] {
    const [methods, setMethods] = useState<string[]>(apiDefaultPaymentMethods);

    useEffect(() => {
        let isMounted = true;

        async function loadSettings() {
            try {
                const response = await fetch('/api/settings', {
                    method: 'GET',
                    cache: 'no-store',
                });

                if (!response.ok) {
                    return;
                }

                const body = (await response.json()) as {
                    settings?: {
                        paymentMethods?: string[];
                    };
                };

                if (isMounted && body.settings?.paymentMethods?.length) {
                    setMethods(body.settings.paymentMethods);
                }
            } catch (error) {
                console.error('Could not load payment methods from API', error);
            }
        }

        void loadSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    return methods;
}
