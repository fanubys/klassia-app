


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

// Custom hook to manage state with localStorage persistence
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}


// MOCK DATA - Used only if localStorage is empty (first visit)
const initialGroups: Group[] = [
  { id: 'g1', name: 'Math 101', studentCount: 4 },
  { id: 'g2', name: 'History 202', studentCount: 3 },
  { id: 'g3', name: 'Art Fundamentals', studentCount: 2 },
  { id: 'g4', name: 'Physics for Beginners', studentCount: 3 },
  { id: 'g5', name: 'Advanced Chemistry', studentCount: 2 },
  { id: 'g6', name: 'Literature Club', studentCount: 5 },
];

const initialStudents: Student[] = [
  { id: 's1', groupId: 'g1', firstName: 'Alice', lastName: 'Johnson', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s1' },
  { id: 's2', groupId: 'g1', firstName: 'Bob', lastName: 'Williams', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s2' },
  { id: 's3', groupId: 'g1', firstName: 'Catherine', lastName: 'Smith', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s3' },
  { id: 's4', groupId: 'g1', firstName: 'David', lastName: 'Jones', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s4' },
  { id: 's5', groupId: 'g2', firstName: 'Charlie', lastName: 'Brown', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s5' },
  { id: 's6', groupId: 'g2', firstName: 'Diana', lastName: 'Miller', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s6' },
  { id: 's7', groupId: 'g2', firstName: 'Edward', lastName: 'Davis', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s7' },
  { id: 's8', groupId: 'g3', firstName: 'Fiona', lastName: 'Garcia', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s8' },
  { id: 's9', groupId: 'g3', firstName: 'George', lastName: 'Rodriguez', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s9' },
  { id: 's10', groupId: 'g4', firstName: 'Hannah', lastName: 'Wilson', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s10' },
  { id: 's11', groupId: 'g4', firstName: 'Ian', lastName: 'Martinez', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s11' },
  { id: 's12', groupId: 'g4', firstName: 'Jane', lastName: 'Anderson', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s12' },
  { id: 's13', groupId: 'g5', firstName: 'Kevin', lastName: 'Taylor', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s13' },
  { id: 's14', groupId: 'g5', firstName: 'Laura', lastName: 'Thomas', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s14' },
  { id: 's15', groupId: 'g6', firstName: 'Michael', lastName: 'Harris', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s15' },
  { id: 's16', groupId: 'g6', firstName: 'Nancy', lastName: 'Clark', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s16' },
  { id: 's17', groupId: 'g6', firstName: 'Olivia', lastName: 'Lewis', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s17' },
  { id: 's18', groupId: 'g6', firstName: 'Peter', lastName: 'Walker', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s18' },
  { id: 's19', groupId: 'g6', firstName: 'Quinn', lastName: 'Hall', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s19' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Inicio);
  const [groups, setGroups] = useLocalStorage<Group[]>('klassia-groups', initialGroups);
  const [students, setStudents] = useLocalStorage<Student[]>('klassia-students', initialStudents);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'error'
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // A simple effect to show a "syncing" status when data changes
    setSyncStatus('syncing');
    const timer = setTimeout(() => {
        // In a real app, this would be an API call confirmation
        setSyncStatus('synced');
    }, 1000);
    return () => clearTimeout(timer);
  }, [groups, students]);

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
        return <Dashboard setActiveTab={setActiveTab} totalStudents={students.length} totalGroups={groups.length}/>;
      case Tab.Grupos:
        return <Groups groups={groups} setGroups={setGroups} students={students} setStudents={setStudents} />;
      case Tab.Asistencia:
        return <Attendance groups={groups} students={students} setStudents={setStudents}/>;
      case Tab.Reportes:
        // We use a key to ensure the component re-mounts when data changes, preventing stale reports.
        const key = `reports-${groups.length}-${students.length}`;
        return <Reports key={key} groups={groups} students={students} />;
      case Tab.Sugerencias:
        return <Sugerencias />;
      case Tab.Configuracion:
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} totalStudents={students.length} totalGroups={groups.length}/>;
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