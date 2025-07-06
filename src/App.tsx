
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import Attendance from './components/Attendance';
import Reports from './components/Reports';
import Sugerencias from './components/Sugerencias';
import Settings from './components/Settings';
import { Tab, Group, Student } from './types';

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

  useEffect(() => {
    // A simple effect to show a "syncing" status when data changes
    setSyncStatus('syncing');
    const timer = setTimeout(() => {
        // In a real app, this would be an API call confirmation
        setSyncStatus('synced');
    }, 1000);
    return () => clearTimeout(timer);
  }, [groups, students]);


  const renderContent = () => {
    switch (activeTab) {
      case Tab.Inicio:
        return <Dashboard setActiveTab={setActiveTab} totalStudents={students.length} totalGroups={groups.length}/>;
      case Tab.Grupos:
        return <Groups groups={groups} setGroups={setGroups} students={students} setStudents={setStudents} />;
      case Tab.Asistencia:
        return <Attendance groups={groups} students={students} setStudents={setStudents}/>;
      case Tab.Reportes:
        return <Reports groups={groups} students={students} />;
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
    </div>
  );
};

export default App;
