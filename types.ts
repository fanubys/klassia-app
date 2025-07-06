export enum Tab {
  Inicio = 'Inicio',
  Grupos = 'Grupos',
  Asistencia = 'Asistencia',
  Reportes = 'Reportes',
  Sugerencias = 'Sugerencias',
  Configuracion = 'Configuración',
}

export enum AttendanceStatus {
  Present = 'Presente',
  Late = 'Tardanza',
  Absent = 'Ausente',
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  observations?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  groupId: string;
  photoUrl?: string;
  attendanceHistory: AttendanceRecord[];
}

export interface Group {
  id: string;
  name: string;
  studentCount: number;
}

export interface ChartData {
  name: string;
  value: number;
}