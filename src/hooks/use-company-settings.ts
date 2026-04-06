'use client';

import { useEffect, useState } from 'react';

import { defaultCompanySettings, type CompanySettings } from '@/lib/app-settings';

export function useCompanySettings(): CompanySettings {
  const [settings, setSettings] = useState<CompanySettings>(defaultCompanySettings);

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
            company?: CompanySettings;
          };
        };

        if (isMounted && body.settings?.company) {
          setSettings({
            ...defaultCompanySettings,
            ...body.settings.company,
          });
        }
      } catch (error) {
        console.error('Could not load company settings from API', error);
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return settings;
}
