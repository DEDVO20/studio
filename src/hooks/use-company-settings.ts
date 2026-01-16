'use client';

import { useState, useEffect } from 'react';
import { defaultLogoBase64 } from '@/lib/logo';

const defaultSettings = {
    name: 'NexusStore Inc.',
    taxId: '900.123.456-7',
    address: '123 Innovation Drive, Tech City',
    phone: '(555) 123-4567',
    email: 'contact@nexusstore.com',
    logoUrl: defaultLogoBase64,
};

type CompanySettings = typeof defaultSettings;

export function useCompanySettings(): CompanySettings {
    const [settings, setSettings] = useState<CompanySettings>(defaultSettings);

    useEffect(() => {
        // This code runs only on the client, after the component has mounted.
        try {
            const storedSettings = localStorage.getItem('companySettings');
            if (storedSettings) {
                const parsedSettings = JSON.parse(storedSettings);
                setSettings({ ...defaultSettings, ...parsedSettings });
            }
        } catch (error) {
            console.error("Could not parse company settings from localStorage", error);
            // Fallback to default settings if there's an error
            setSettings(defaultSettings);
        }
    }, []);

    return settings;
}
