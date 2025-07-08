import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import { Group, Student, AttendanceStatus } from '../types';
import { Camera, Check, Clock, X, Save, ZoomIn, FileUp, ArrowLeft, ChevronRight, Users } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';


interface AttendanceProps {
    groups: Group[];
    students: Student[];
}

const ImageZoomModal: React.FC<{ imageUrl: string; onClose: () => void }> = ({ imageUrl, onClose }) => (
    <div
        className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex justify-center items-center p-4 transition-opacity duration-300"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
        <img
            src={imageUrl}
            alt="Student zoomed"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        />
    </div>
);

const StatusBadge: React.FC<{ status?: AttendanceStatus }> = ({ status }) => {
    switch (status) {
        case AttendanceStatus.Present:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-success/20 text-success">Presente</span>;
        case AttendanceStatus.Late:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-warning/20 text-warning">Tardanza</span>;
        case AttendanceStatus.Absent:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-danger/20 text-danger">Ausente</span>;
        default:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-600/50 text-gray-400">Sin Marcar</span>;
    }
};

const Attendance: React.FC<AttendanceProps> = ({ groups, students }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
    const [dailyAttendance, setDailyAttendance] = useState<Record<string, { status: AttendanceStatus; observations: string }>>({});
    
    // State for individual student view
    const [currentStatus, setCurrentStatus] = useState<AttendanceStatus | null>(null);
    const [currentObservations, setCurrentObservations] = useState('');
    const [photoUrl, setPhotoUrl] = useState<string | undefined>('');
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showFeedback = (message: string, type: 'success' | 'error') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 3000);
    };
    
    const getTodayString = () => new Date().toISOString().split('T')[0];

    // Effect to handle group changes (e.g., deletion) and load daily attendance
    useEffect(() => {
        const groupExists = groups.some(g => g.id === selectedGroupId);
        if (!groupExists && groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        } else if (groups.length === 0) {
            setSelectedGroupId('');
        }

        // Load today's attendance for the selected group
        const todayStr = getTodayString();
        const todaysRecords: Record<string, { status: AttendanceStatus; observations: string }> = {};
        students
            .filter(s => s.groupId === selectedGroupId)
            .forEach(s => {
                const record = s.attendanceHistory.find(r => r.date === todayStr);
                if (record) {
                    todaysRecords[s.id] = { status: record.status, observations: record.observations || '' };
                }
            });
        setDailyAttendance(todaysRecords);

    }, [groups, students, selectedGroupId]);

    const studentsInSelectedGroup = students.filter(s => s.groupId === selectedGroupId);
    
    const handleSelectStudent = (student: Student) => {
        setViewingStudent(student);
        const attendance = dailyAttendance[student.id];
        setCurrentStatus(attendance?.status || null);
        setCurrentObservations(attendance?.observations || '');
        setPhotoUrl(student.photoUrl);
    };

    const handleGoBackToList = () => {
        setViewingStudent(null);
        setCurrentStatus(null);
        setCurrentObservations('');
        setPhotoUrl('');
    };
    
    const handleSaveAttendance = async () => {
        if (!viewingStudent || !currentStatus) {
            alert('Por favor, selecciona un estado de asistencia.');
            return;
        }

        const todayStr = getTodayString();
        const studentRef = doc(db, 'students', viewingStudent.id);
        const groupRef = doc(db, 'groups', viewingStudent.groupId);
        
        try {
            // Find if there's an existing record for today
            const existingRecord = viewingStudent.attendanceHistory.find(r => r.date === todayStr);
            const newRecord = {
                date: todayStr,
                status: currentStatus,
                observations: currentObservations
            };

            if (existingRecord) {
                // To update an item in an array, we remove the old and add the new one.
                await updateDoc(studentRef, {
                    attendanceHistory: arrayRemove(existingRecord)
                });
            }
            
            await updateDoc(studentRef, {
                attendanceHistory: arrayUnion(newRecord)
            });
            
            // Update the group's last modified timestamp
            await updateDoc(groupRef, { lastModified: new Date().toLocaleString('es-ES') });
            
            // Update the local daily state for immediate UI feedback
            setDailyAttendance(prev => ({
                ...prev,
                [viewingStudent.id]: {
                    status: currentStatus,
                    observations: currentObservations
                }
            }));
            
            showFeedback('Asistencia guardada correctamente.', 'success');
            handleGoBackToList();

        } catch (e) {
            console.error("Error saving attendance: ", e);
            showFeedback('Error al guardar la asistencia.', 'error');
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/') && viewingStudent) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (e.target?.result) {
                    const newPhotoUrl = e.target.result as string;
                    // Update the temporary URL for the detail view's image tag
                    setPhotoUrl(newPhotoUrl);
                    
                    try {
                        const studentRef = doc(db, 'students', viewingStudent.id);
                        await updateDoc(studentRef, { photoUrl: newPhotoUrl });
                        showFeedback("Foto actualizada.", 'success');
                    } catch(err) {
                        console.error("Error uploading photo:", err);
                        showFeedback("Error al subir la foto.", 'error');
                        setPhotoUrl(viewingStudent.photoUrl); // Revert on error
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (viewingStudent) {
        return (
            <>
                <Card>
                    <div className="flex items-center mb-6">
                        <button onClick={handleGoBackToList} className="p-2 rounded-full hover:bg-gray-700 mr-4">
                            <ArrowLeft size={20} className="text-gray-300" />
                        </button>
                        <h2 className="text-xl font-bold text-white">Registro de Asistencia</h2>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Photo Section */}
                        <div className="flex flex-col items-center flex-shrink-0 md:w-1/3">
                             <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                            <button 
                                onClick={() => photoUrl && setIsZoomModalOpen(true)}
                                disabled={!photoUrl}
                                className="group relative w-40 h-40 bg-gray-700 rounded-full flex items-center justify-center mb-4 overflow-hidden ring-4 ring-primary/30 hover:ring-primary/60 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:ring-gray-600"
                                aria-label="Ampliar foto del estudiante"
                            >
                                {photoUrl ? (
                                    <>
                                        <img src={photoUrl} alt="Student" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
                                            <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                                        </div>
                                    </>
                                ) : (
                                    <Users size={48} className="text-gray-500"/>
                                )}
                            </button>
                            <div className="flex items-center justify-center gap-2">
                                <button className="inline-flex items-center justify-center px-3 py-1 border border-primary text-xs font-medium rounded-md text-primary bg-transparent hover:bg-primary/20">
                                    <Camera size={14} className="mr-1"/> Tomar Foto
                                </button>
                                <button onClick={handleUploadClick} className="inline-flex items-center justify-center px-3 py-1 border border-gray-600 text-xs font-medium rounded-md text-gray-300 bg-transparent hover:bg-gray-700">
                                    <FileUp size={14} className="mr-1"/> Cargar
                                </button>
                            </div>
                        </div>

                        {/* Attendance Form */}
                        <div className="flex-grow space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{viewingStudent.firstName} {viewingStudent.lastName}</h3>
                                <p className="text-gray-400">ID: {viewingStudent.id}</p>
                            </div>

                            <div>
                                 <h4 className="text-md font-medium text-white mb-2">Marcar Asistencia</h4>
                                 <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                    <button onClick={() => setCurrentStatus(AttendanceStatus.Present)} className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-semibold ${currentStatus === AttendanceStatus.Present ? 'bg-success/20 border-success text-success' : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300'}`}>
                                        <Check size={18} className="mr-0 sm:mr-2 flex-shrink-0" /> <span className="hidden sm:inline">Presente</span>
                                    </button>
                                    <button onClick={() => setCurrentStatus(AttendanceStatus.Late)} className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-semibold ${currentStatus === AttendanceStatus.Late ? 'bg-warning/20 border-warning text-warning' : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300'}`}>
                                        <Clock size={18} className="mr-0 sm:mr-2 flex-shrink-0" /> <span className="hidden sm:inline">Tardanza</span>
                                    </button>
                                    <button onClick={() => setCurrentStatus(AttendanceStatus.Absent)} className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-semibold ${currentStatus === AttendanceStatus.Absent ? 'bg-danger/20 border-danger text-danger' : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300'}`}>
                                        <X size={18} className="mr-0 sm:mr-2 flex-shrink-0" /> <span className="hidden sm:inline">Ausente</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="observations" className="block text-sm font-medium text-gray-300">Observaciones</label>
                                <textarea id="observations" value={currentObservations} onChange={e => setCurrentObservations(e.target.value)} rows={3} className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm bg-gray-700 border-gray-600 rounded-md text-white" placeholder="Escribe observaciones aquí..."></textarea>
                            </div>
                            <button onClick={handleSaveAttendance} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!currentStatus}>
                                <Save size={20} className="mr-2"/> Guardar Asistencia
                            </button>
                        </div>
                    </div>
                </Card>
                {isZoomModalOpen && photoUrl && <ImageZoomModal imageUrl={photoUrl} onClose={() => setIsZoomModalOpen(false)} />}
            </>
        )
    }
    
    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const todayStr = getTodayString();
    const todayFormatted = new Date(todayStr.replace(/-/g, '/')).toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
      <>
        {feedback && (
          <div className={`fixed top-20 right-6 z-[100] p-3 rounded-md shadow-lg text-sm text-white ${feedback.type === 'success' ? 'bg-success' : 'bg-danger'}`}>
              {feedback.message}
          </div>
        )}
        <Card title="Control de Asistencia">
            <div className="space-y-6">
                 <div className="text-center pb-4 mb-4 border-b border-gray-700">
                    <p className="text-lg font-semibold text-gray-200">
                        Registrando asistencia para el día:
                    </p>
                    <p className="text-primary font-bold text-xl">{todayFormatted}</p>
                </div>
                <div>
                    <label htmlFor="group" className="block text-sm font-medium text-gray-300 mb-1">Seleccionar Grupo</label>
                    <select id="group" value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md" disabled={groups.length === 0}>
                        {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                </div>
                
                {selectedGroup ? (
                  <div>
                      <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2 mb-4">
                          Estudiantes en "{selectedGroup.name}"
                      </h3>
                      {studentsInSelectedGroup.length > 0 ? (
                          <div className="space-y-2">
                              {studentsInSelectedGroup.map(student => (
                                   <button key={student.id} onClick={() => handleSelectStudent(student)} className="w-full flex items-center p-3 rounded-lg hover:bg-gray-700/60 transition-colors cursor-pointer text-left">
                                      {student.photoUrl ? (
                                        <img src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-10 h-10 rounded-full object-cover mr-4" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-4 flex-shrink-0">
                                            <Users size={20} className="text-gray-400" />
                                        </div>
                                      )}
                                      <div className="flex-grow">
                                          <p className="font-medium text-gray-100">{student.firstName} {student.lastName}</p>
                                      </div>
                                      <div className="flex items-center">
                                          <StatusBadge status={dailyAttendance[student.id]?.status} />
                                          <ChevronRight className="w-5 h-5 text-gray-500 ml-3" />
                                      </div>
                                  </button>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-10 px-4 text-gray-500 bg-gray-800/50 rounded-lg">
                              <Users size={48} className="mx-auto text-gray-600 mb-4" />
                              <h3 className="text-lg font-semibold text-gray-300">No hay estudiantes en este grupo</h3>
                              <p className="mt-1 text-sm">
                                  Para empezar a tomar asistencia, primero añade estudiantes
                                  en la pestaña de <span className="font-semibold text-primary-light">Grupos</span>.
                              </p>
                          </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 text-gray-500 bg-gray-800/50 rounded-lg">
                      <Users size={48} className="mx-auto text-gray-600 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-300">No hay grupos disponibles</h3>
                      <p className="mt-1 text-sm">
                          Para empezar, crea o importa tu primer grupo 
                          en la pestaña de <span className="font-semibold text-primary-light">Grupos</span>.
                      </p>
                  </div>
                )}
            </div>
        </Card>
      </>
    );
};

export default Attendance;
