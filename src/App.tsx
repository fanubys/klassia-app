import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import Attendance from './components/Attendance';
import Reports from './components/Reports';
import Sugerencias from './components/Sugerencias';
import Settings from './components/Settings';
import { Tab, Group, Student } from './types';
import { RefreshCw } from 'lucide-react';
import { useFirestoreSync } from './hooks/useFirestoreSync';

const UpdatePrompt: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => (
    <div className="fixed bottom-6 right-6 z-[100] bg-gray-700 text-white p-4 rounded-lg shadow-xl flex items-center space-x-4 animate-fade-in-up border border-gray-600">
        <div>
            <p className="font-semibold text-gray-100">Nueva versión disponible</p>
            <p className="text-sm text-gray-300">Recarga para actualizar la aplicación.</p>
        </div>
        <button
            onClick={onUpdate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-primary"
            aria-label="Recargar página"
        >
            <RefreshCw size={16} className="mr-2"/>
            Recargar
        </button>
    </div>
);


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Inicio);
  const { data: groups, loading: groupsLoading, error: groupsError } = useFirestoreSync<Group>('groups', 'name');
  const { data: students, loading: studentsLoading, error: studentsError } = useFirestoreSync<Student>('students', 'lastName');
  const [syncStatus, setSyncStatus] = useState('syncing');
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (groupsLoading || studentsLoading) {
        setSyncStatus('syncing');
    } else if (groupsError || studentsError) {
        setSyncStatus('error');
    } else {
        setSyncStatus('synced');
    }
  }, [groupsLoading, studentsLoading, groupsError, studentsError]);

  
  // Service Worker update logic
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        // Construct an absolute URL for the service worker to avoid cross-origin errors in sandboxed environments.
        const swUrl = `${window.location.origin}/service-worker.js`;
        navigator.serviceWorker.register(swUrl).then(registration => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New update available
                                setWaitingWorker(installingWorker);
                                setShowUpdatePrompt(true);
                            }
                        }
                    };
                }
            };
        }).catch(error => {
            console.error('Error during service worker registration:', error);
        });

        let refreshing: boolean;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
      };
      
      // Robust registration: handle cases where the 'load' event has already fired.
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        // Cleanup listener on component unmount
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  const updateServiceWorker = () => {
    if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        setShowUpdatePrompt(false);
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case Tab.Inicio:
        return <Dashboard setActiveTab={setActiveTab} totalStudents={students.length} totalGroups={groups.length} students={students} />;
      case Tab.Grupos:
        return <Groups groups={groups} students={students} />;
      case Tab.Asistencia:
        return <Attendance groups={groups} students={students} />;
      case Tab.Reportes:
        // We use a key to ensure the component re-mounts when data changes, preventing stale reports.
        const key = `reports-${groups.length}-${students.length}`;
        return <Reports key={key} groups={groups} students={students} />;
      case Tab.Sugerencias:
        return <Sugerencias />;
      case Tab.Configuracion:
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} totalStudents={students.length} totalGroups={groups.length} students={students} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} syncStatus={syncStatus} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      {showUpdatePrompt && <UpdatePrompt onUpdate={updateServiceWorker} />}
    </div>
  );
};

export default App;
