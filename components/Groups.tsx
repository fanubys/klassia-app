
import React, { useState, useCallback, useRef } from 'react';
import Card from './Card';
import { Group, Student } from '../types';
import { Plus, Search, Edit, Trash2, FileUp, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

interface GroupsProps {
    groups: Group[];
    students: Student[];
    setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const Groups: React.FC<GroupsProps> = ({ groups, students, setGroups, setStudents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [currentGroupName, setCurrentGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  const [viewingStudentsOf, setViewingStudentsOf] = useState<Group | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [currentStudentFirstName, setCurrentStudentFirstName] = useState('');
  const [currentStudentLastName, setCurrentStudentLastName] = useState('');

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- Group Management ---
  const openGroupModalForAdd = () => {
    setEditingGroup(null);
    setCurrentGroupName('');
    setIsGroupModalOpen(true);
  };
  
  const openGroupModalForEdit = (group: Group) => {
    setEditingGroup(group);
    setCurrentGroupName(group.name);
    setIsGroupModalOpen(true);
  };

  const closeGroupModal = useCallback(() => {
    setIsGroupModalOpen(false);
    setCurrentGroupName('');
    setEditingGroup(null);
  }, []);

  const handleSaveGroup = useCallback(() => {
    if (!currentGroupName.trim()) return;
    const trimmedName = currentGroupName.trim();

    if (editingGroup) {
      setGroups(prev =>
        prev.map(g =>
          g.id === editingGroup.id ? { ...g, name: trimmedName } : g
        )
      );
      showFeedback(`Grupo "${trimmedName}" actualizado correctamente.`, 'success');
    } else {
      const newGroup: Group = {
        id: `g${Date.now()}`,
        name: trimmedName,
        studentCount: 0,
      };
      setGroups(prev => [newGroup, ...prev]);
      showFeedback(`Grupo "${trimmedName}" añadido correctamente.`, 'success');
    }
    closeGroupModal();
  }, [currentGroupName, editingGroup, closeGroupModal, setGroups]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    const groupToDelete = groups.find(g => g.id === groupId);
    if (!groupToDelete) return;

    if (window.confirm(`¿Estás seguro de que quieres eliminar el grupo "${groupToDelete.name}"? Esta acción eliminará también a todos sus estudiantes.`)) {
      setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
      setStudents(prevStudents => prevStudents.filter(student => student.groupId !== groupId));
      showFeedback(`El grupo "${groupToDelete.name}" se ha eliminado correctamente.`, 'success');
    }
  }, [groups, setGroups, setStudents]);

  // --- Student Management ---
  const handleViewStudents = (group: Group) => {
    setViewingStudentsOf(group);
    setSearchTerm('');
  };

  const closeStudentView = () => {
    setViewingStudentsOf(null);
    setSearchTerm('');
  };

  const openStudentModalForAdd = () => {
    setEditingStudent(null);
    setCurrentStudentFirstName('');
    setCurrentStudentLastName('');
    setIsStudentModalOpen(true);
  };

  const openStudentModalForEdit = (student: Student) => {
    setEditingStudent(student);
    setCurrentStudentFirstName(student.firstName);
    setCurrentStudentLastName(student.lastName);
    setIsStudentModalOpen(true);
  };
  
  const closeStudentModal = useCallback(() => {
    setIsStudentModalOpen(false);
    setEditingStudent(null);
    setCurrentStudentFirstName('');
    setCurrentStudentLastName('');
  }, []);

  const handleSaveStudent = useCallback(() => {
    if (!currentStudentFirstName.trim() || !currentStudentLastName.trim() || !viewingStudentsOf) return;
    
    const fullName = `${currentStudentFirstName.trim()} ${currentStudentLastName.trim()}`;

    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, firstName: currentStudentFirstName.trim(), lastName: currentStudentLastName.trim() } : s));
      showFeedback(`Estudiante "${fullName}" actualizado.`, 'success');
    } else {
      const newStudent: Student = {
        id: `s${Date.now()}`,
        groupId: viewingStudentsOf.id,
        firstName: currentStudentFirstName.trim(),
        lastName: currentStudentLastName.trim(),
        attendanceHistory: [],
      };
      setStudents(prev => [newStudent, ...prev]);
      setGroups(prev => prev.map(g => g.id === viewingStudentsOf.id ? { ...g, studentCount: g.studentCount + 1 } : g));
      showFeedback(`Estudiante "${fullName}" añadido a ${viewingStudentsOf.name}.`, 'success');
    }
    closeStudentModal();
  }, [currentStudentFirstName, currentStudentLastName, editingStudent, viewingStudentsOf, closeStudentModal, setStudents, setGroups]);

  const handleDeleteStudent = useCallback((student: Student) => {
    if (!viewingStudentsOf) return;
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${student.firstName} ${student.lastName}?`)) {
      setStudents(prev => prev.filter(s => s.id !== student.id));
      setGroups(prev => prev.map(g => g.id === viewingStudentsOf.id ? { ...g, studentCount: g.studentCount - 1 } : g));
      showFeedback(`Estudiante eliminado.`, 'success');
    }
  }, [viewingStudentsOf, setStudents, setGroups]);

  const filteredStudents = viewingStudentsOf
    ? students.filter(student => student.groupId === viewingStudentsOf.id &&
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  // --- Import ---
  const handleImportClick = () => fileInputRef.current?.click();
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFeedback(null);
      const reader = new FileReader();
      
      reader.onload = (e) => {
          try {
              const groupNameFromFilename = file.name.replace(/\.[^/.]+$/, "").trim();
              if (!groupNameFromFilename) {
                  showFeedback('No se pudo determinar el nombre del grupo desde el nombre del archivo.', 'error');
                  return;
              }
              const isNameDuplicate = groups.some(g => g.name.toLowerCase() === groupNameFromFilename.toLowerCase());
              if (isNameDuplicate) {
                  showFeedback(`Un grupo con el nombre "${groupNameFromFilename}" ya existe.`, 'error');
                  return;
              }

              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

              const newStudents: Student[] = [];
              const newGroupId = `g${Date.now()}`;

              for (const row of rows) {
                  const fullName = row[0]; // Assuming name is in the first column
                  if (fullName && typeof fullName === 'string' && fullName.trim()) {
                      const nameParts = fullName.trim().split(/\s+/);
                      const firstName = nameParts.shift() || '';
                      const lastName = nameParts.join(' ') || '';
                      
                      if (firstName) { // Ensure there is at least a first name
                          newStudents.push({
                              id: `s${Date.now()}-${newStudents.length}`,
                              groupId: newGroupId,
                              firstName,
                              lastName,
                              attendanceHistory: [],
                              photoUrl: `https://i.pravatar.cc/150?u=s${Date.now()}-${newStudents.length}`
                          });
                      }
                  }
              }

              if (newStudents.length === 0) {
                  showFeedback('No se encontraron nombres de estudiantes válidos en la primera columna del archivo.', 'error');
                  return;
              }

              const newGroup: Group = {
                  id: newGroupId,
                  name: groupNameFromFilename,
                  studentCount: newStudents.length,
              };
              
              setGroups(prev => [newGroup, ...prev]);
              setStudents(prev => [...prev, ...newStudents]);
              showFeedback(`Grupo "${groupNameFromFilename}" con ${newStudents.length} estudiantes importado correctamente.`, 'success');

          } catch (error: any) {
              console.error('Error importing file:', error);
              showFeedback(`Error al importar el archivo: ${error.message || 'Formato de archivo inválido.'}`, 'error');
          } finally {
              if (event.target) event.target.value = '';
          }
      };
      
      reader.onerror = () => {
          showFeedback('No se pudo leer el archivo.', 'error');
          if (event.target) event.target.value = '';
      };
      
      reader.readAsArrayBuffer(file);
  };
  
  const renderGroupList = () => (
    <Card 
      title="Gestión de Grupos"
      actions={
        <div className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx,.xls,.csv,.ods"/>
          <button onClick={handleImportClick} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-success hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <FileUp size={16} className="mr-2"/> Importar
          </button>
          <button onClick={openGroupModalForAdd} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <Plus size={16} className="mr-2"/> Nuevo Grupo
          </button>
        </div>
      }
    >
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Buscar grupo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border bg-gray-700 border-gray-600 rounded-md focus:ring-primary focus:border-primary text-white placeholder-gray-400"/>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre del Grupo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estudiantes</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredGroups.map((group) => (
              <tr key={group.id} className="hover:bg-gray-700/60">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleViewStudents(group)} className="text-gray-100 hover:text-primary transition-colors font-semibold">
                    {group.name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{group.studentCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    <button onClick={() => openGroupModalForEdit(group)} className="text-secondary hover:text-secondary/80" title="Editar grupo"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteGroup(group.id)} className="text-danger hover:text-danger/80" title="Eliminar grupo"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderStudentList = () => (
    <Card 
        title={`Estudiantes en "${viewingStudentsOf?.name}"`}
        actions={
            <button onClick={closeStudentView} className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none">
                <ArrowLeft size={16} className="mr-2"/> Volver a Grupos
            </button>
        }
    >
        <div className="relative pb-16">
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Buscar estudiante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border bg-gray-700 border-gray-600 rounded-md focus:ring-primary focus:border-primary text-white placeholder-gray-400"/>
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Apellido</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-700/60">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{student.firstName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{student.lastName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-4">
                                        <button onClick={() => openStudentModalForEdit(student)} className="text-secondary hover:text-secondary/80" title="Editar estudiante"><Edit size={18} /></button>
                                        <button onClick={() => handleDeleteStudent(student)} className="text-danger hover:text-danger/80" title="Eliminar estudiante"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             <div className="absolute bottom-0 right-0">
                <button
                    onClick={openStudentModalForAdd}
                    className="bg-primary hover:bg-primary-dark text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary"
                    title="Añadir Estudiante"
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>
    </Card>
  );

  return (
    <>
      {feedback && (
          <div className={`fixed top-20 right-6 z-[100] p-3 rounded-md shadow-lg text-sm text-white ${feedback.type === 'success' ? 'bg-success' : 'bg-danger'}`}>
              {feedback.message}
          </div>
      )}
      
      {viewingStudentsOf ? renderStudentList() : renderGroupList()}
      
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-white mb-4">{editingGroup ? 'Editar Grupo' : 'Añadir Nuevo Grupo'}</h3>
            <div>
              <label htmlFor="group-name" className="block text-sm font-medium text-gray-300">Nombre del Grupo</label>
              <input type="text" id="group-name" value={currentGroupName} onChange={(e) => setCurrentGroupName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSaveGroup()} autoFocus className="mt-1 block w-full px-3 py-2 border bg-gray-700 border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white"/>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={closeGroupModal} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-transparent rounded-md hover:bg-gray-600 focus:outline-none">Cancelar</button>
              <button type="button" onClick={handleSaveGroup} disabled={!currentGroupName.trim()} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:bg-gray-500 disabled:cursor-not-allowed">{editingGroup ? 'Guardar Cambios' : 'Guardar Grupo'}</button>
            </div>
          </div>
        </div>
      )}

      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-white mb-4">{editingStudent ? 'Editar Estudiante' : 'Añadir Nuevo Estudiante'}</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="student-firstname" className="block text-sm font-medium text-gray-300">Nombre</label>
                    <input type="text" id="student-firstname" value={currentStudentFirstName} onChange={(e) => setCurrentStudentFirstName(e.target.value)} autoFocus className="mt-1 block w-full px-3 py-2 border bg-gray-700 border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white"/>
                </div>
                <div>
                    <label htmlFor="student-lastname" className="block text-sm font-medium text-gray-300">Apellido</label>
                    <input type="text" id="student-lastname" value={currentStudentLastName} onChange={(e) => setCurrentStudentLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 border bg-gray-700 border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white"/>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={closeStudentModal} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-transparent rounded-md hover:bg-gray-600 focus:outline-none">Cancelar</button>
              <button type="button" onClick={handleSaveStudent} disabled={!currentStudentFirstName.trim() || !currentStudentLastName.trim()} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:bg-gray-500 disabled:cursor-not-allowed">{editingStudent ? 'Guardar Cambios' : 'Guardar Estudiante'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Groups;
