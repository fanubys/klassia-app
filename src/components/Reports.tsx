import React, { useState, useRef, useMemo, useEffect } from 'react';
import Card from './Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, Label } from 'recharts';
import { Wand2, FileDown, ArrowLeft, Users } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Group, Student, AttendanceStatus } from '../types';

const STATUS_COLORS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.Present]: '#4ade80', // success
    [AttendanceStatus.Late]: '#facc15', // warning
    [AttendanceStatus.Absent]: '#f87171', // danger
};

interface ReportsProps {
    groups: Group[];
    students: Student[];
}

const Reports: React.FC<ReportsProps> = ({ groups, students }) => {
    const [aiSummary, setAiSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('all');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const reportContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If the selected group no longer exists (e.g., was deleted), reset the view.
        if (selectedGroupId !== 'all' && !groups.some(g => g.id === selectedGroupId)) {
            setSelectedGroupId('all');
            setSelectedStudentId(null);
        }
    }, [groups, selectedGroupId]);
    
    const reportData = useMemo(() => {
        const studentSource = selectedGroupId === 'all' 
            ? students 
            : students.filter(s => s.groupId === selectedGroupId);
            
        // 1. Attendance by Group
        const attendanceByGroup = groups.map(group => {
            const groupStudents = students.filter(s => s.groupId === group.id);
            if (groupStudents.length === 0) return { name: group.name, Asistencia: 0 };
            
            const totalRecords = groupStudents.reduce((acc, s) => acc + s.attendanceHistory.length, 0);
            const presentRecords = groupStudents.reduce((acc, s) => acc + s.attendanceHistory.filter(r => r.status === AttendanceStatus.Present).length, 0);
            
            return {
                name: group.name,
                Asistencia: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0,
            };
        });

        // 2. Status Distribution (for selected group or all)
        const allRecords = studentSource.flatMap(s => s.attendanceHistory);
        const statusDistribution = [
            { name: 'Presente', value: allRecords.filter(r => r.status === AttendanceStatus.Present).length, color: STATUS_COLORS.Presente },
            { name: 'Tardanza', value: allRecords.filter(r => r.status === AttendanceStatus.Late).length, color: STATUS_COLORS.Tardanza },
            { name: 'Ausente', value: allRecords.filter(r => r.status === AttendanceStatus.Absent).length, color: STATUS_COLORS.Ausente },
        ].filter(d => d.value > 0);

        // 3. Student Attendance in Group
        const studentAttendance = studentSource.map(student => {
            const total = student.attendanceHistory.length;
            const present = student.attendanceHistory.filter(r => r.status === AttendanceStatus.Present).length;
            return {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                Asistencia: total > 0 ? Math.round((present / total) * 100) : 0,
            };
        });

        return { attendanceByGroup, statusDistribution, studentAttendance };

    }, [students, groups, selectedGroupId]);

    const selectedStudent = useMemo(() => {
        if (!selectedStudentId) return null;
        return students.find(s => s.id === selectedStudentId);
    }, [selectedStudentId, students]);

    const selectedStudentChartData = useMemo(() => {
        if (!selectedStudent) return [];
        const history = selectedStudent.attendanceHistory;
        return [
            { name: 'Presente', value: history.filter(r => r.status === AttendanceStatus.Present).length, color: STATUS_COLORS.Presente },
            { name: 'Tardanza', value: history.filter(r => r.status === AttendanceStatus.Late).length, color: STATUS_COLORS.Tardanza },
            { name: 'Ausente', value: history.filter(r => r.status === AttendanceStatus.Absent).length, color: STATUS_COLORS.Ausente },
        ].filter(d => d.value > 0);
    }, [selectedStudent]);

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setAiSummary('');
        setError('');

        const dataForPrompt = selectedStudent 
          ? `Resumen para el estudiante ${selectedStudent.firstName} ${selectedStudent.lastName}. Su historial es: ${JSON.stringify(selectedStudentChartData)}.`
          : `Resumen para ${selectedGroupId === 'all' ? 'todos los grupos' : `el grupo ${groups.find(g => g.id === selectedGroupId)?.name}`}.
             - Asistencia por estudiante (%): ${JSON.stringify(reportData.studentAttendance)}
             - Distribución de estados: ${JSON.stringify(reportData.statusDistribution)}`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                Generate a brief, insightful summary of the following attendance data for an academic report.
                Focus on performance, trends, and potential areas of concern.
                ${dataForPrompt}
                Provide the summary in Spanish, in a professional and concise tone. Use bullet points for key takeaways.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
            });

            setAiSummary(response.text);
        } catch (err: any) {
            console.error("Error generating AI summary:", err);
            setError(`Hubo un error al generar el resumen: ${err.message || 'Por favor, intente de nuevo.'}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExportPDF = async () => {
        const content = reportContentRef.current;
        if (!content) return;

        try {
            const canvas = await html2canvas(content, {
                 backgroundColor: '#1f2937', // bg-gray-800
                 scale: 2
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`reporte-klassia-${selectedStudent ? selectedStudent.id : selectedGroupId}-${Date.now()}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF.");
        }
    };

    const handleExportExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            if (selectedStudent) {
                 const studentData = selectedStudent.attendanceHistory.map(r => ({ Fecha: r.date, Estado: r.status, Observaciones: r.observations || ''}));
                 const ws = XLSX.utils.json_to_sheet(studentData);
                 XLSX.utils.book_append_sheet(wb, ws, `Historial ${selectedStudent.firstName}`);
            } else {
                 const studentPerfData = selectedGroupId === 'all' 
                    ? reportData.attendanceByGroup 
                    : reportData.studentAttendance;
                const studentPerfWs = XLSX.utils.json_to_sheet(studentPerfData);
                const sheet1Name = selectedGroupId === 'all' ? 'Asistencia por Grupo' : 'Asistencia por Estudiante';
                XLSX.utils.book_append_sheet(wb, studentPerfWs, sheet1Name);


                 const statusData = reportData.statusDistribution.map(s => ({ 'Estado': s.name, 'Cantidad': s.value }));
                 const ws2 = XLSX.utils.json_to_sheet(statusData);
                 XLSX.utils.book_append_sheet(wb, ws2, 'Distribución de Estados');
            }
             if (aiSummary) {
                const summaryData = [{ 'Resumen Generado por IA': aiSummary.replace(/\*/g, '') }];
                const ws3 = XLSX.utils.json_to_sheet(summaryData);
                 XLSX.utils.book_append_sheet(wb, ws3, 'Resumen IA');
            }
            XLSX.writeFile(wb, `reporte-klassia-${selectedStudent ? selectedStudent.id : selectedGroupId}-${Date.now()}.xlsx`);
        } catch (error) {
            console.error("Error generating Excel:", error);
            alert("Hubo un error al generar el archivo Excel.");
        }
    };

    const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGroupId(e.target.value);
        setSelectedStudentId(null);
        setAiSummary('');
        setError('');
    };

    const renderStudentDetailView = () => {
        if (!selectedStudent) return null;
        const totalRecords = selectedStudent.attendanceHistory.length;
        const presentRecords = selectedStudentChartData.find(d => d.name === 'Presente')?.value || 0;
        const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

        return (
            <div className="space-y-6">
                <Card title={`Reporte de ${selectedStudent.firstName} ${selectedStudent.lastName}`} actions={
                     <button onClick={() => setSelectedStudentId(null)} className="inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none">
                        <ArrowLeft size={16} className="mr-2"/> Volver al Grupo
                    </button>
                }>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center justify-center">
                            {selectedStudent.photoUrl ? (
                                <img src={selectedStudent.photoUrl} alt="student" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-primary" />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4 ring-4 ring-primary">
                                    <Users size={48} className="text-gray-400" />
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-white text-center">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                            <p className="text-gray-400">ID: {selectedStudent.id}</p>
                        </div>
                         <div className="md:col-span-2">
                             <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={selectedStudentChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}>
                                        {selectedStudentChartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} />)}
                                        <Label value={`${attendancePercentage}%`} position="center" fill="#FFF" className="text-3xl font-bold" />
                                    </Pie>
                                    <Tooltip wrapperClassName="!rounded-md !border-gray-600 !bg-gray-800 !shadow-lg" contentStyle={{ backgroundColor: 'transparent', border: 'none' }} />
                                    <Legend wrapperStyle={{ color: '#d1d5db', paddingTop: '10px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </Card>
                 <Card title="Historial de Asistencia">
                    <div className="overflow-y-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-700">
                             <thead className="bg-gray-700/50 sticky top-0 z-10">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Observaciones</th>
                                </tr>
                              </thead>
                              <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {selectedStudent.attendanceHistory.length > 0 ? [...selectedStudent.attendanceHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                                     <tr key={record.date} className="hover:bg-gray-700/60">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{record.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{color: STATUS_COLORS[record.status]}}>{record.status}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 max-w-xs truncate" title={record.observations}>{record.observations || '-'}</td>
                                     </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-10 text-gray-500">No hay registros de asistencia para este estudiante.</td>
                                    </tr>
                                )}
                              </tbody>
                        </table>
                    </div>
                 </Card>
            </div>
        )
    }

    const renderGroupView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={selectedGroupId === 'all' ? "Asistencia General por Grupo (%)" : `Asistencia por Estudiante en ${groups.find(g=>g.id === selectedGroupId)?.name || ''} (%)`}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                        data={selectedGroupId === 'all' ? reportData.attendanceByGroup : reportData.studentAttendance}
                        layout={selectedGroupId === 'all' ? "horizontal" : "vertical"}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                        <XAxis type={selectedGroupId === 'all' ? "category" : "number"} dataKey={selectedGroupId === 'all' ? "name" : "Asistencia"} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis type={selectedGroupId === 'all' ? "number" : "category"} dataKey={selectedGroupId === 'all' ? "Asistencia" : "name"} stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} width={80} interval={0} />
                        <Tooltip wrapperClassName="!rounded-md !border-gray-600 !bg-gray-800 !shadow-lg" contentStyle={{ backgroundColor: 'transparent', border: 'none' }} cursor={{fill: 'rgba(100, 116, 139, 0.3)'}} />
                        <Bar dataKey="Asistencia" fill="rgb(var(--color-primary-val))" radius={[4, 4, 0, 0]} barSize={20} onClick={(data) => selectedGroupId !== 'all' && setSelectedStudentId(data.id)}>
                             { (selectedGroupId !== 'all' ? reportData.studentAttendance : reportData.attendanceByGroup).map((entry, index) => (
                                <Cell key={`cell-${index}`} className={selectedGroupId !== 'all' ? 'cursor-pointer' : ''}/>
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                {selectedGroupId !== 'all' && reportData.studentAttendance.length > 0 && <p className="text-center text-xs text-gray-500 mt-2">Haz clic en una barra para ver el detalle del estudiante.</p>}
            </Card>
            <Card title="Distribución de Estados">
                {reportData.statusDistribution.length > 0 ? (
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={reportData.statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return (<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text>);}}>
                            {reportData.statusDistribution.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip wrapperClassName="!rounded-md !border-gray-600 !bg-gray-800 !shadow-lg" contentStyle={{ backgroundColor: 'transparent', border: 'none' }} />
                        <Legend wrapperStyle={{ color: '#d1d5db' }}/>
                    </PieChart>
                </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-center text-gray-500">No hay datos de asistencia para mostrar.</div>
                )}
            </Card>
        </div>
    )

    return (
        <div className="space-y-6">
            <Card 
              title="Filtros y Acciones"
              actions={
                <div className="flex items-center space-x-2">
                   <button onClick={handleExportExcel} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-success hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <FileDown size={16} className="mr-2"/> Excel
                    </button>
                    <button onClick={handleExportPDF} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-danger hover:bg-danger/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        <FileDown size={16} className="mr-2"/> PDF
                    </button>
                </div>
              }
            >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="report-group" className="block text-sm font-medium text-gray-300">Grupo</label>
                        <select id="report-group" value={selectedGroupId} onChange={handleGroupChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                            <option value="all">Todos los grupos</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="report-month" className="block text-sm font-medium text-gray-300">Mes (Próximamente)</label>
                        <input type="month" id="report-month" disabled defaultValue={new Date().toISOString().slice(0, 7)} className="mt-1 block w-full pl-3 pr-4 py-2 text-base bg-gray-700/50 border-gray-600 text-gray-400 focus:outline-none sm:text-sm rounded-md cursor-not-allowed" />
                    </div>
                </div>
            </Card>

            <div ref={reportContentRef} className="space-y-6 p-4 bg-gray-800 rounded-lg">
                {selectedStudentId ? renderStudentDetailView() : renderGroupView()}
                
                <Card title="Resumen con IA">
                    <div className="flex flex-col items-start">
                         <button 
                            onClick={handleGenerateSummary}
                            disabled={isLoading}
                            className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary/90 disabled:bg-gray-500">
                            <Wand2 size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}/> 
                            {isLoading ? 'Generando...' : 'Generar Resumen'}
                        </button>
                        {(aiSummary || error) && (
                            <div className={`p-4 rounded-md w-full border ${error ? 'bg-danger/10 border-danger/30' : 'bg-gray-700/50 border-gray-700'}`}>
                                <div className={`${error ? 'text-danger' : 'text-gray-300'} whitespace-pre-wrap prose prose-invert prose-sm max-w-none`} dangerouslySetInnerHTML={{__html: error || aiSummary.replace(/\n/g, '<br />')}}>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;