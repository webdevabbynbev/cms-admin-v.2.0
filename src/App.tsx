import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import CsvImportWatcher from '@/features/products/components/CsvImportWatcher';
import { AppProviders } from '@/providers';
import { router } from '@/router';
import { useThemeStore } from '@/stores/theme.store';
import { initPerformanceMonitoring } from './utils/analytics';
import { initServiceWorker } from './utils/pwa';

function App() {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    root.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    initPerformanceMonitoring();
    initServiceWorker();
  }, []);

  return (
    <AppProviders>
      <CsvImportWatcher />
      <Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}

export default App;
