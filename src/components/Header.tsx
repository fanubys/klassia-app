import React, { useState } from 'react';
import { Tab } from '../types';
import { Menu, X, Loader, CheckCircle, XCircle, WifiOff } from 'lucide-react';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  syncStatus: string;
  isOffline?: boolean;
}

const SyncIndicator: React.FC<{ status: string }> = ({ status }) => {
    const indicatorClasses = "transition-opacity duration-300";
    if (status === 'syncing') {
        return (
            <span title="Sincronizando...">
                <Loader size={16} className={`${indicatorClasses} animate-spin text-white`} />
            </span>
        );
    }
    if (status === 'synced') {
        return (
            <span title="Datos sincronizados">
                <CheckCircle size={16} className={`${indicatorClasses} text-green-300`} />
            </span>
        );
    }
    if (status === 'error') {
        return (
            <span title="Error de sincronización">
                <XCircle size={16} className={`${indicatorClasses} text-red-300`} />
            </span>
        );
    }
    return <div style={{width: 16, height: 16}}></div>;
};

const OfflineIndicator: React.FC = () => (
    <div className="flex items-center text-yellow-400" title="Mostrando datos locales. No hay conexión con el servidor.">
        <WifiOff size={16} className="mr-1" />
        <span className="text-sm font-medium">Offline</span>
    </div>
);


const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, syncStatus, isOffline }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tabs = Object.values(Tab);

  const NavTab = ({ tab, isMobile }: { tab: Tab, isMobile?: boolean }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
      }}
      className={`
        px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200
        ${activeTab === tab 
          ? 'bg-black/20 text-white' 
          : 'text-gray-300 hover:bg-black/20 hover:text-white'
        }
        ${isMobile ? 'w-full text-left' : ''}
      `}
    >
      {tab}
    </button>
  );

  return (
    <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src="/icon-192.png" alt="Klassia-app Logo" className="h-8 w-8 mr-2" />
            <span className="font-bold text-xl tracking-tight">Klassia-app</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {tabs.map((tab) => <NavTab key={tab} tab={tab} />)}
            </div>
          </div>
          <div className="flex items-center gap-4">
              {isOffline && <OfflineIndicator />}
              <div className="w-4 h-4 flex items-center justify-center">
                  <SyncIndicator status={syncStatus} />
              </div>
              <div className="md:hidden">
                  <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/20 focus:outline-none"
                  >
                      {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
              </div>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden p-2">
          <div className="flex flex-col space-y-1">
            {tabs.map((tab) => <NavTab key={`mobile-${tab}`} tab={tab} isMobile />)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;