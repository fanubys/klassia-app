
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import Attendance from './components/Attendance';
import Reports from './components/Reports';
import Sugerencias from './components/Sugerencias';
import Settings from './components/Settings';
import { Tab, Group, Student } from './types';

// MOCK DATA CENTRALIZED
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
  { id: 's15', groupId: 'g6', firstName: 'Michael', lastName: 'Hernandez', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s15' },
  { id: 's16', groupId: 'g6', firstName: 'Nancy', lastName: 'Moore', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s16' },
  { id: 's17', groupId: 'g6', firstName: 'Oscar', lastName: 'Martin', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s17' },
  { id: 's18', groupId: 'g6', firstName: 'Patricia', lastName: 'Jackson', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s18' },
  { id: 's19', groupId: 'g6', firstName: 'Quentin', lastName: 'Thompson', attendanceHistory: [], photoUrl: 'https://i.pravatar.cc/150?u=s19' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Inicio);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [students, setStudents] = useState<Student[]>(initialStudents);


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
        return <Dashboard setActiveTab={setActiveTab} totalStudents={students.length} totalGroups={groups.length} />;
      case Tab.Grupos:
        return <Groups groups={groups} students={students} setGroups={setGroups} setStudents={setStudents} />;
      case Tab.Asistencia:
        return <Attendance groups={groups} students={students} setStudents={setStudents} />;
      case Tab.Reportes:
        return <Reports />;
      case Tab.Sugerencias:
        return <Sugerencias />;
      case Tab.Configuracion:
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} totalStudents={students.length} totalGroups={groups.length}/>;
    }
  }, [activeTab, groups, students]);

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
