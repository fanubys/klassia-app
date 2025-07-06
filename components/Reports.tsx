
import React, { useState, useRef } from 'react';
import Card from './Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Wand2, FileDown } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';


const attendanceByGroup = [
  { name: 'Math 101', attendance: 92 },
  { name: 'History 202', attendance: 85 },
  { name: 'Art', attendance: 98 },
  { name: 'Physics', attendance: 78 },
  { name: 'Chemistry', attendance: 89 },
];

const statusDistribution = [
  { name: 'Presente', value: 250, color: '#4cc9f0' },
  { name: 'Tardanza', value: 30, color: '#f8961e' },
  { name: 'Ausente', value: 15, color: '#f72585' },
];

const Reports: React.FC = () => {
    const [aiSummary, setAiSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const reportContentRef = useRef<HTMLDivElement>(null);

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setAiSummary('');
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                Generate a brief, insightful summary of the following attendance data for an academic report.
                Focus on performance and potential areas of concern.
                - Attendance by group (%): ${JSON.stringify(attendanceByGroup)}
                - Overall attendance status counts: ${JSON.stringify(statusDistribution)}
                Provide the summary in Spanish, in a professional and concise tone.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
            });

            setAiSummary(response.text);
        } catch (err) {
            console.error("Error generating AI summary:", err);
            setError("Hubo un error al generar el resumen. Por favor, intente de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExportPDF = async () => {
        const content = reportContentRef.current;
        if (!content) return;

        try {
            const canvas = await html2canvas(content, {
                 backgroundColor: '#111827', // bg-gray-900
                 scale: 2
            });
            const imgData = canvas.toDataURL('image/png');
            // Use exact canvas dimensions for the PDF page to avoid cutting content
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('reporte-klassia.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF.");
        }
    };

    const handleExportExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            
            const groupData = attendanceByGroup.map(g => ({ 'Nombre del Grupo': g.name, 'Asistencia (%)': g.attendance }));
            const ws1 = XLSX.utils.json_to_sheet(groupData);
            XLSX.utils.book_append_sheet(wb, ws1, 'Asistencia por Grupo');

            const statusData = statusDistribution.map(s => ({ 'Estado': s.name, 'Cantidad': s.value }));
            const ws2 = XLSX.utils.json_to_sheet(statusData);
            XLSX.utils.book_append_sheet(wb, ws2, 'Distribución de Asistencias');

            if (aiSummary) {
                const summaryData = [{ 'Resumen Generado por IA': aiSummary.replace(/\*/g, '') }]; // Remove markdown
                const ws3 = XLSX.utils.json_to_sheet(summaryData);
                 XLSX.utils.book_append_sheet(wb, ws3, 'Resumen IA');
            }

            XLSX.writeFile(wb, 'reporte-klassia.xlsx');
        } catch (error) {
            console.error("Error generating Excel:", error);
            alert("Hubo un error al generar el archivo Excel.");
        }
    };

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
                        <label htmlFor="report-month" className="block text-sm font-medium text-gray-300">Mes</label>
                        <input type="month" id="report-month" defaultValue={new Date().toISOString().slice(0, 7)} className="mt-1 block w-full pl-3 pr-4 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="report-group" className="block text-sm font-medium text-gray-300">Grupo</label>
                        <select id="report-group" className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                            <option>Todos los grupos</option>
                            <option>Math 101</option>
                            <option>History 202</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div ref={reportContentRef} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Asistencia por Grupo (%)">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={attendanceByGroup}>
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip wrapperClassName="!rounded-md !border-gray-600 !bg-gray-800 !shadow-lg" contentStyle={{ backgroundColor: 'transparent', border: 'none' }} cursor={{fill: 'rgba(100, 116, 139, 0.3)'}} />
                                <Bar dataKey="attendance" fill="#4361ee" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card title="Distribución de Asistencias">
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return (<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text>);}}>
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip wrapperClassName="!rounded-md !border-gray-600 !bg-gray-800 !shadow-lg" contentStyle={{ backgroundColor: 'transparent', border: 'none' }} />
                                <Legend wrapperStyle={{ color: '#d1d5db' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
                
                <Card title="Resumen con IA">
                    <div className="flex flex-col items-start">
                         <button 
                            onClick={handleGenerateSummary}
                            disabled={isLoading}
                            className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary/90 disabled:bg-gray-400">
                            <Wand2 size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}/> 
                            {isLoading ? 'Generando...' : 'Generar Resumen'}
                        </button>
                        {(aiSummary || error) && (
                            <div className={`p-4 rounded-md w-full border ${error ? 'bg-danger/10 border-danger/30' : 'bg-gray-700/50 border-gray-700'}`}>
                                <p className={`${error ? 'text-danger' : 'text-gray-300'} whitespace-pre-wrap`}>
                                    {error || aiSummary}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
