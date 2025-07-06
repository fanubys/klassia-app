
import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import { Palette, RotateCcw } from 'lucide-react';

const DEFAULT_PRIMARY_COLOR = '#4361ee';
const DEFAULT_SECONDARY_COLOR = '#4cc9f0';

const Settings: React.FC = () => {
    const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
    const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR);

    const hexToRgb = useCallback((hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex[1] + hex[2], 16);
            g = parseInt(hex[3] + hex[4], 16);
            b = parseInt(hex[5] + hex[6], 16);
        }
        return `${r} ${g} ${b}`;
    }, []);

    // Effect to load colors from localStorage on initial mount
    useEffect(() => {
        const storedPrimary = localStorage.getItem('theme-primary-color') || DEFAULT_PRIMARY_COLOR;
        const storedSecondary = localStorage.getItem('theme-secondary-color') || DEFAULT_SECONDARY_COLOR;
        setPrimaryColor(storedPrimary);
        setSecondaryColor(storedSecondary);
    }, []);

    // Effect to update CSS variables and localStorage when colors change
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--color-primary-val', hexToRgb(primaryColor));
        root.style.setProperty('--color-secondary-val', hexToRgb(secondaryColor));
        localStorage.setItem('theme-primary-color', primaryColor);
        localStorage.setItem('theme-secondary-color', secondaryColor);
    }, [primaryColor, secondaryColor, hexToRgb]);
    
    const handleResetColors = () => {
        setPrimaryColor(DEFAULT_PRIMARY_COLOR);
        setSecondaryColor(DEFAULT_SECONDARY_COLOR);
    };

  return (
    <Card 
        title="Personalización de Tema"
        actions={
            <div className="flex items-center text-sm text-gray-400">
                <Palette size={16} className="mr-2 text-primary"/>
                <span>Adapta los colores a tu gusto</span>
            </div>
        }
    >
        <div className="max-w-md mx-auto">
            <div className="space-y-6">
                <p className="text-gray-400">
                    Selecciona los colores principales de la interfaz. Los cambios se guardarán en tu dispositivo.
                </p>
                <div className="flex items-center justify-between">
                    <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-200">Color Primario</label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-sm">{primaryColor}</span>
                        <input 
                            type="color" 
                            id="primaryColor" 
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                        />
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-200">Color Secundario</label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-sm">{secondaryColor}</span>
                        <input 
                            type="color" 
                            id="secondaryColor"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                        />
                    </div>
                </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-6">
                <button 
                    onClick={handleResetColors}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary"
                >
                    <RotateCcw size={16} className="mr-2"/> Restaurar Colores por Defecto
                </button>
            </div>
        </div>
    </Card>
  );
};

export default Settings;