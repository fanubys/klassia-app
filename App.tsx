
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import Attendance from './components/Attendance';
import Reports from './components/Reports';
import Sugerencias from './components/Sugerencias';
import Settings from './components/Settings';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Inicio);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error

  useEffect(() => {
    const syncInterval = setInterval(async () => {
        setSyncStatus('syncing');
        console.log('Syncing attendance data...');
        try {
            // Simulate network request
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Sync successful!');
            setSyncStatus('synced');
        } catch (error) {
            console.error('Sync failed:', error);
            setSyncStatus('error');
        }
        // Reset status back to idle after a few seconds
        setTimeout(() => setSyncStatus('idle'), 2000);
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, []);


  const renderContent = useCallback(() => {
    switch (activeTab) {
      case Tab.Inicio:
        return <Dashboard setActiveTab={setActiveTab} />;
      case Tab.Grupos:
        return <Groups />;
      case Tab.Asistencia:
        return <Attendance />;
      case Tab.Reportes:
        return <Reports />;
      case Tab.Sugerencias:
        return <Sugerencias />;
      case Tab.Configuracion:
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-200">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} syncStatus={syncStatus} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <footer className="p-4 text-gray-400 text-sm border-t border-gray-700 bg-gray-800">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-1 text-center flex-wrap">
            <span>Desarrollado por: Fabián de Castillo</span>
            <span className="hidden sm:inline">|</span>
            <a href="mailto:fabdecas@gmail.com" className="text-primary-light hover:underline">email: fabdecas@gmail.com</a>
            <span>celular: +598 92 603 921</span>
        </div>
      </footer>
    </div>
  );
};

export default App;