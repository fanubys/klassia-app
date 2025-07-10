
import React, { useState } from 'react';
import Card from './Card';
import { GoogleGenAI } from '@google/genai';
import { Send, Wand2 } from 'lucide-react';

const Sugerencias: React.FC = () => {
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSendSuggestion = async () => {
        if (!suggestion.trim()) {
            setFeedbackMessage('Por favor, escribe tu sugerencia antes de enviar.');
            setIsError(true);
            return;
        }

        setIsLoading(true);
        setFeedbackMessage('');
        setIsError(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Un usuario de la aplicación Klassia-app ha enviado la siguiente sugerencia para mejorar el producto. Analiza el sentimiento y la viabilidad de la sugerencia, y clasifícala. Sugerencia: "${suggestion}"`;
            
            // We don't need the response for this mock, just the successful call
            await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setFeedbackMessage('¡Gracias por tu sugerencia! La hemos recibido y la tendremos en cuenta para futuras mejoras.');
            setSuggestion('');
        } catch (error: any) {
            console.error("Error sending suggestion:", error);
            setFeedbackMessage(`Hubo un error al enviar tu sugerencia. ${error.message || 'Por favor, inténtalo de nuevo más tarde.'}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card 
          title="Enviar Sugerencias"
          actions={
            <div className="flex items-center text-sm text-gray-400">
              <Wand2 size={16} className="mr-2 text-primary"/>
              <span>Potenciado por IA</span>
            </div>
          }
        >
            <div className="max-w-2xl mx-auto">
                <p className="mb-4 text-gray-400">
                    ¿Tienes alguna idea para mejorar Klassia-app? ¡Nos encantaría escucharla! Tu opinión es muy importante para nosotros.
                </p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="suggestion" className="sr-only">Sugerencia</label>
                        <textarea 
                            id="suggestion"
                            rows={6}
                            value={suggestion}
                            onChange={(e) => setSuggestion(e.target.value)}
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm bg-gray-700 border-gray-600 rounded-md text-white placeholder:text-gray-400" 
                            placeholder="Describe tu idea, sugerencia o mejora aquí..."
                            disabled={isLoading}
                        />
                    </div>
                    <button 
                        onClick={handleSendSuggestion}
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <Send size={20} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}/>
                        {isLoading ? 'Enviando...' : 'Enviar Sugerencia'}
                    </button>
                </div>
                {feedbackMessage && (
                    <div className={`mt-4 p-4 rounded-md w-full border ${isError ? 'bg-danger/10 border-danger/30' : 'bg-success/10 border-success/30'}`}>
                        <p className={`text-center ${isError ? 'text-danger' : 'text-success'}`}>{feedbackMessage}</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Sugerencias;
