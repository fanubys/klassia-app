import React, { useMemo } from 'react';
import Card from './Card';
import Calendar from './Calendar';
import { Tab, Student } from '../types';
import { Users, BookOpen, CheckCircle, Play } from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: Tab) => void;
  totalStudents: number;
  totalGroups: number;
  students: Student[];
}

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string; color: string, iconColor: string }> = ({ icon: Icon, label, value, color, iconColor }) => (
  <Card className="flex items-start">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      <Icon className={iconColor} size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </Card>
);

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, totalStudents, totalGroups, students }) => {
  const today = new Date();
  const version = `v${__APP_VERSION__} (compilado: ${__BUILD_TIMESTAMP__})`;

  const registeredTodayCount = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0];
    return students.filter(student => 
      student.attendanceHistory?.some(record => record.date === todayStr)
    ).length;
  }, [students, today]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/30 to-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="md:w-2/3">
            <h1 className="text-3xl font-bold text-white">Bienvenido a Klassia-app</h1>
            <p className="mt-2 text-gray-300">
              El sistema de control de asistencia inteligente que simplifica la gestión de tus grupos y estudiantes.
            </p>
            <button 
              onClick={() => setActiveTab(Tab.Asistencia)}
              className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Play className="mr-2 -ml-1 h-5 w-5" />
              Empezar ahora
            </button>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <img src="/portada1.png" alt="Estudiantes aprendiendo" className="rounded-lg shadow-lg object-cover w-full h-auto max-w-xs transition-transform duration-300 ease-in-out hover:scale-105" />
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={Users} label="Total Estudiantes" value={totalStudents.toString()} color="bg-blue-500/20" iconColor="text-blue-300" />
        <StatCard icon={BookOpen} label="Total Grupos" value={totalGroups.toString()} color="bg-indigo-500/20" iconColor="text-indigo-300" />
        <StatCard icon={CheckCircle} label="Asistencias Registradas Hoy" value={registeredTodayCount.toString()} color="bg-green-500/20" iconColor="text-green-300" />
      </div>

      <Card title="Calendario de Asistencias">
        <Calendar date={today} students={students} />
      </Card>
      <footer className="text-center text-gray-500 text-xs pt-4">
        <p>{version}</p>
        <p>Conectado al proyecto: <span className="font-semibold text-gray-400">{__PROJECT_ID__ || 'Desconocido'}</span></p>
      </footer>
    </div>
  );
};

export default Dashboard;