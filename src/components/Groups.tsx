import React, { useState, useCallback, useRef } from 'react';
import Card from './Card';
import { Group, Student } from '../types';
import { Plus, Search, Edit, Trash2, FileUp, ArrowLeft, Wand2, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';


interface GroupsProps {
    groups: Group[];
    students: Student[];
}

const Groups: React.FC<GroupsProps> = ({ groups, students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [currentGroupName, setCurrentGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  const [viewingStudentsOf, setViewingStudentsOf] = useState<Group | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [currentStudentFirstName, setCurrentStudentFirstName] = useState('');
  const [currentStudentLastName, setCurrentStudentLastName] = useState('');

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for AI import modal
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{headers: string[], data: any[][], fileName: string} | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{suggestedGroupName: string, firstNameColumnIndex: number, lastNameColumnIndex: number, headerRowIndex: number} | null>(null);
  const [importSettings, setImportSettings] = useState({groupName: '', firstNameCol: '0', lastNameCol: '-1', headerRowIndex: -1 });
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const showFeedback = (message: string, type: 'success' | 'error' | 'warning') => {
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

  const handleSaveGroup = async () => {
    if (!currentGroupName.trim()) return;
    const trimmedName = currentGroupName.trim();
    const modificationDate = new Date().toLocaleString('es-ES');

    try {
        if (editingGroup) {
            const groupRef = doc(db, 'groups', editingGroup.id);
            await updateDoc(groupRef, { name: trimmedName, lastModified: modificationDate });
            showFeedback(`Grupo "${trimmedName}" actualizado correctamente.`, 'success');
        } else {
            await addDoc(collection(db, 'groups'), {
                name: trimmedName,
                studentCount: 0,
                lastModified: modificationDate
            });
            showFeedback(`Grupo "${trimmedName}" añadido correctamente.`, 'success');
        }
    } catch (e) {
        console.error("Error saving group: ", e);
        showFeedback("Error al guardar el grupo.", 'error');
    }
    
    closeGroupModal();
  };

  const handleDeleteGroup = async (groupId: string) => {
    const groupToDelete = groups.find(g => g.id === groupId);
    if (!groupToDelete) return;

    if (window.confirm(`¿Estás seguro de que quieres eliminar el grupo "${groupToDelete.name}"? Esta acción eliminará también a todos sus estudiantes.`)) {
        try {
            const batch = writeBatch(db);
            
            // Delete the group
            const groupRef = doc(db, 'groups', groupId);
            batch.delete(groupRef);

            // Find and delete associated students
            const studentsQuery = query(collection(db, 'students'), where('groupId', '==', groupId));
            const studentDocs = await getDocs(studentsQuery);
            studentDocs.forEach(studentDoc => {
                batch.delete(studentDoc.ref);
            });

            await batch.commit();
            showFeedback(`El grupo "${groupToDelete.name}" y sus estudiantes han sido eliminados.`, 'success');

        } catch (e) {
            console.error("Error deleting group: ", e);
            showFeedback("Error al eliminar el grupo.", "error");
        }
    }
  };

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

  const handleSaveStudent = async () => {
    if (!currentStudentFirstName.trim() || !viewingStudentsOf) return;
    
    const fullName = `${currentStudentFirstName.trim()} ${currentStudentLastName.trim()}`;
    const modificationDate = new Date().toLocaleString('es-ES');
    const groupRef = doc(db, 'groups', viewingStudentsOf.id);

    try {
        if (editingStudent) {
            const studentRef = doc(db, 'students', editingStudent.id);
            await updateDoc(studentRef, { firstName: currentStudentFirstName.trim(), lastName: currentStudentLastName.trim() });
            showFeedback(`Estudiante "${fullName}" actualizado.`, 'success');
        } else {
            await addDoc(collection(db, 'students'), {
                groupId: viewingStudentsOf.id,
                firstName: currentStudentFirstName.trim(),
                lastName: currentStudentLastName.trim(),
                attendanceHistory: [],
            });
            const newCount = (viewingStudentsOf.studentCount || 0) + 1;
            await updateDoc(groupRef, { studentCount: newCount, lastModified: modificationDate });
            showFeedback(`Estudiante "${fullName}" añadido a ${viewingStudentsOf.name}.`, 'success');
        }
    } catch(e) {
        console.error("Error saving student: ", e);
        showFeedback("Error al guardar el estudiante.", "error");
    }
    
    closeStudentModal();
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!viewingStudentsOf) return;
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${student.firstName} ${student.lastName}?`)) {
        try {
            await deleteDoc(doc(db, 'students', student.id));
            const groupRef = doc(db, 'groups', viewingStudentsOf.id);
            const newCount = Math.max(0, (viewingStudentsOf.studentCount || 1) - 1);
            await updateDoc(groupRef, { studentCount: newCount, lastModified: new Date().toLocaleString('es-ES') });
            showFeedback(`Estudiante eliminado.`, 'success');
        } catch(e) {
            console.error("Error deleting student: ", e);
            showFeedback("Error al eliminar el estudiante.", "error");
        }
    }
  };

  const filteredStudents = viewingStudentsOf
    ? students.filter(student => student.groupId === viewingStudentsOf.id &&
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  // --- Import ---
  const handleImportClick = () => fileInputRef.current?.click();
  
  const analyzeAndShowImportModal = async (rows: any[][], fileName: string) => {
      setIsAiLoading(true);
      
      const headerRowGuess = rows.findIndex(row => row.some(cell => typeof cell === 'string' && cell.trim().length > 0));
      const headers = rows[headerRowGuess] || [];
      const sampleData = rows.slice(headerRowGuess + 1, headerRowGuess + 6);
      const groupNameFromFilename = fileName.replace(/\.[^/.]+$/, "").trim();

      setImportPreview({ headers, data: rows, fileName });
      setIsImportConfirmOpen(true);
      setImportSettings({ groupName: groupNameFromFilename, firstNameCol: '0', lastNameCol: '-1', headerRowIndex: -1 }); // Reset
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            You are an intelligent data import assistant. Analyze the following spreadsheet data (headers and a few sample rows) and determine the columns for student names.

            Spreadsheet Data:
            Headers: ${JSON.stringify(headers)}
            Sample Rows: ${JSON.stringify(sampleData)}
            Filename: "${fileName}"

            Based on the data, provide the following in a single JSON object:
            1. "suggestedGroupName": A plausible name for the group, based on the filename or data content.
            2. "firstNameColumnIndex": The 0-based index of the column that most likely contains the student's First Name. If a full name is in one column, use that column's index.
            3. "lastNameColumnIndex": The 0-based index of the column that most likely contains the student's Last Name. If the full name is in the first name column, return -1 for this index.
            4. "headerRowIndex": The 0-based index of the row that seems to be a header. If no header row is apparent, return -1 or your best guess.

            Return ONLY a valid JSON object.
        `;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^\\\`\\\`\\\`(\w*)?\s*\n?(.*?)\n?\s*\\\`\\\`\\\`$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const suggestions = JSON.parse(jsonStr);
        setAiSuggestions(suggestions);
        setImportSettings({
            groupName: suggestions.suggestedGroupName || groupNameFromFilename,
            firstNameCol: String(suggestions.firstNameColumnIndex ?? 0),
            lastNameCol: String(suggestions.lastNameColumnIndex ?? -1),
            headerRowIndex: suggestions.headerRowIndex ?? -1
        });

      } catch (e) {
          console.error("AI analysis failed:", e);
          showFeedback("La IA no pudo analizar el archivo. Por favor, configura la importación manualmente.", 'warning');
          setAiSuggestions(null);
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFeedback(null);
      const reader = new FileReader();
      
      reader.onload = (e) => {
          try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
              
              if(rows.length === 0) {
                  showFeedback('El archivo parece estar vacío.', 'error');
                  return;
              }

              analyzeAndShowImportModal(rows, file.name);

          } catch (error: any) {
              console.error('Error importing file:', error);
              showFeedback(`Error al procesar el archivo: ${error.message || 'Formato de archivo inválido.'}`, 'error');
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
  
  const handleConfirmImport = async () => {
      if (!importPreview || !importSettings.groupName.trim()) {
          showFeedback('Falta información para la importación.', 'error');
          return;
      }
      
      const { groupName, firstNameCol, lastNameCol, headerRowIndex } = importSettings;
      
      const isNameDuplicate = groups.some(g => g.name.toLowerCase() === groupName.trim().toLowerCase());
      if (isNameDuplicate) {
          showFeedback(`Un grupo con el nombre "${groupName.trim()}" ya existe.`, 'error');
          return;
      }

      const newStudentsData: Omit<Student, 'id'>[] = [];
      const startRow = headerRowIndex === -1 ? 0 : headerRowIndex + 1;
      const fnCol = parseInt(firstNameCol);
      const lnCol = parseInt(lastNameCol);

      for (const row of importPreview.data.slice(startRow)) {
          if (!row || row.every(cell => !cell)) continue;
          
          let firstName = '', lastName = '';

          if (lnCol === -1) { // Single full name column
              const fullName = row[fnCol];
              if (fullName && typeof fullName === 'string' && fullName.trim()) {
                  const nameParts = fullName.trim().split(/\s+/);
                  firstName = nameParts.shift() || '';
                  lastName = nameParts.join(' ') || '';
              }
          } else { // Separate first and last name columns
              firstName = row[fnCol] ? String(row[fnCol]).trim() : '';
              lastName = row[lnCol] ? String(row[lnCol]).trim() : '';
          }
          
          if (firstName) {
              newStudentsData.push({
                  firstName,
                  lastName,
                  groupId: '', // Will be set after group is created
                  attendanceHistory: [],
              });
          }
      }

      if (newStudentsData.length === 0) {
          showFeedback('No se encontraron estudiantes válidos con la configuración seleccionada.', 'error');
          return;
      }

      try {
        const batch = writeBatch(db);

        // 1. Create the new group
        const newGroupRef = doc(collection(db, 'groups'));
        batch.set(newGroupRef, {
            name: groupName.trim(),
            studentCount: newStudentsData.length,
            lastModified: new Date().toLocaleString('es-ES'),
        });
        
        // 2. Create all student documents
        newStudentsData.forEach(studentData => {
            const studentRef = doc(collection(db, 'students'));
            batch.set(studentRef, { ...studentData, groupId: newGroupRef.id });
        });
        
        // 3. Commit the batch
        await batch.commit();

        showFeedback(`Grupo "${groupName.trim()}" con ${newStudentsData.length} estudiantes importado correctamente.`, 'success');

      } catch (e) {
        console.error("Error committing import batch: ", e);
        showFeedback("Ocurrió un error masivo al importar. Inténtelo de nuevo.", 'error');
      }
      
      // Close modal
      setIsImportConfirmOpen(false);
      setImportPreview(null);
      setAiSuggestions(null);
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Última Modificación</th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{group.lastModified || '-'}</td>
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

  const renderImportConfirmModal = () => {
    if (!isImportConfirmOpen || !importPreview) return null;

    const headersToShow = importSettings.headerRowIndex !== -1 ? importPreview.data[importSettings.headerRowIndex] : importPreview.data[0];
    
    const columns = headersToShow?.map((h, i) => ({ value: String(i), label: `${h || `Columna ${String.fromCharCode(65 + i)}`}` })) || [];
    
    const headerRowOptions = [
        {value: -1, label: "Sin encabezado"},
        ...importPreview.data.slice(0,5).map((r,i) => ({value: i, label: `Fila ${i+1}`}))
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-white flex items-center">
                        <Wand2 className="mr-2 text-secondary" /> Asistente de Importación IA
                    </h3>
                    {isAiLoading && <Loader className="animate-spin text-secondary" />}
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="group-name-import" className="block text-sm font-medium text-gray-300">Nombre del Grupo</label>
                            <input type="text" id="group-name-import" value={importSettings.groupName} onChange={(e) => setImportSettings(s => ({...s, groupName: e.target.value}))} className="mt-1 block w-full px-3 py-2 border bg-gray-700 border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white"/>
                        </div>
                        <div>
                            <label htmlFor="header-row-import" className="block text-sm font-medium text-gray-300">Fila de encabezado</label>
                            <select id="header-row-import" value={importSettings.headerRowIndex} onChange={(e) => setImportSettings(s => ({...s, headerRowIndex: parseInt(e.target.value)}))} className="mt-1 block w-full px-3 py-2 border bg-gray-700 border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white">
                                {headerRowOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="firstname-col-import" className="block text-sm font-medium text-gray-300">Columna de Nombre(s)</label>
                            <select id="firstname-col-import" value={importSettings.firstNameCol} onChange={(e) => setImportSettings(s => ({...s, firstNameCol: e.target.value}))} className="mt-1 block w-full px-3 py-2 border bg-gray-700 border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white">
                                {columns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="lastname-col-import" className="block text-sm font-medium text-gray-300">Columna de Apellido(s)</label>
                            <select id="lastname-col-import" value={importSettings.lastNameCol} onChange={(e) => setImportSettings(s => ({...s, lastNameCol: e.target.value}))} className="mt-1 block w-full px-3 py-2 border bg-gray-700 border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white">
                                <option value="-1">--- No especificar (nombre completo en una columna) ---</option>
                                {columns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-md font-medium text-white mb-2">Vista Previa de Datos</h4>
                        <div className="overflow-x-auto max-h-60 border border-gray-700 rounded-md">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-700/50 sticky top-0">
                                    <tr>
                                        {importPreview.data[0].map((_, i) => <th key={i} className="px-4 py-2 text-left font-medium text-gray-300">{`Columna ${String.fromCharCode(65 + i)}`}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {importPreview.data.slice(0, 10).map((row, rowIndex) => (
                                        <tr key={rowIndex} className={`${rowIndex === importSettings.headerRowIndex ? 'bg-primary/20' : ''}`}>
                                            {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-gray-400 truncate max-w-xs">{cell}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={() => setIsImportConfirmOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-transparent rounded-md hover:bg-gray-600 focus:outline-none">Cancelar</button>
                    <button type="button" onClick={handleConfirmImport} disabled={!importSettings.groupName.trim() || isAiLoading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:bg-gray-500 disabled:cursor-not-allowed">Importar Grupo</button>
                </div>
            </div>
        </div>
    );
  };

  const feedbackBgClass = {
      'success': 'bg-success',
      'error': 'bg-danger',
      'warning': 'bg-warning'
  };

  return (
    <>
      {feedback && (
          <div className={`fixed top-20 right-6 z-[100] p-3 rounded-md shadow-lg text-sm text-white ${feedbackBgClass[feedback.type]}`}>
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
                    <input type="text" id="student-lastname" value={currentStudentLastName} onChange={(e) => setCurrentStudentLastName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSaveStudent()} className="mt-1 block w-full px-3 py-2 border bg-gray-700 border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-white"/>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={closeStudentModal} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-transparent rounded-md hover:bg-gray-600 focus:outline-none">Cancelar</button>
              <button type="button" onClick={handleSaveStudent} disabled={!currentStudentFirstName.trim()} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:bg-gray-500 disabled:cursor-not-allowed">{editingStudent ? 'Guardar Cambios' : 'Guardar Estudiante'}</button>
            </div>
          </div>
        </div>
      )}
      {renderImportConfirmModal()}
    </>
  );
};

export default Groups;