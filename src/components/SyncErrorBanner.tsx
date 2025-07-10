import React from 'react';
import { XCircle, X } from 'lucide-react';
import { FirestoreError } from 'firebase/firestore';

interface SyncErrorBannerProps {
  error: Error | FirestoreError | null;
  onClose: () => void;
}

const getFriendlyError = (error: Error | FirestoreError): { title: string, message: string, suggestion: string } => {
    const code = (error as FirestoreError).code;
    const message = error.message.toLowerCase();
    
    // Custom config error from firebase.ts
    if (message.includes('configuración de firebase incompleta')) {
        return {
            title: 'Error de Configuración Inicial',
            message: "La aplicación no pudo encontrar las credenciales de Firebase. Sin ellas, no es posible conectar a la base de datos.",
            suggestion: `Revisa que tu archivo de entorno (\`.env\` o \`.env.local\`) esté en la raíz del proyecto y que contenga la variable \`VITE_FIREBASE_PROJECT_ID\` y las demás claves de Firebase.`
        };
    }
    
    // Specific Firestore error codes
    switch (code) {
        case 'permission-denied':
        case 'unauthenticated':
            return {
                title: 'Acceso Denegado a la Base de Datos',
                message: 'Tu solicitud fue rechazada por el servidor. Esto usualmente significa que no tienes permisos para leer o escribir datos.',
                suggestion: `Verifica las Reglas de Seguridad en tu consola de Firebase. Para un entorno de desarrollo, podrías usar: \`allow read, write: if true;\` (¡No usar en producción!).`
            };
        case 'failed-precondition':
             return {
                title: 'Requisito Fallido',
                message: 'La operación no pudo ser ejecutada. Esto puede deberse a que se necesita un índice de base de datos que no existe, o a un problema de configuración más profundo.',
                suggestion: `Si el error menciona un índice, créalo usando el enlace que provee Firebase en la consola del navegador. Si no, verifica que la API de "Cloud Firestore" esté habilitada en tu proyecto de Google Cloud.`
            };
        case 'unavailable':
            return {
                title: 'Servidor No Disponible',
                message: 'No se pudo conectar con los servidores de Firestore. Es posible que estés offline o que haya un problema de red.',
                suggestion: `Verifica tu conexión a internet. La aplicación seguirá funcionando con los datos que tenga guardados localmente.`
            };
    }

    // Generic network or setup errors based on message content
    if (message.includes('400') || message.includes('bad request')) {
        return {
            title: 'Error de Solicitud (400)',
            message: 'El servidor de Firestore rechazó la solicitud por ser inválida. Esto suele ocurrir cuando la base de datos no se ha creado correctamente.',
            suggestion: `Ve a tu consola de Firebase, entra a Firestore y asegúrate de haber creado una base de datos (elige una región). También, verifica que la API "Cloud Firestore" esté habilitada en Google Cloud.`
        };
    }
     if (message.includes('404') || message.includes('not found')) {
        return {
            title: 'Recurso no encontrado (404)',
            message: 'La solicitud apunta a una ubicación que no existe en el servidor.',
            suggestion: `Esto puede ser un error interno. Revisa la consola del navegador para más detalles y asegúrate que los nombres de las colecciones en el código son correctos.`
        };
    }

    // Default fallback error
    return {
        title: 'Error de Sincronización Inesperado',
        message: 'Ocurrió un problema al intentar conectar con la nube.',
        suggestion: `Intenta recargar la página. Si el problema persiste, revisa la consola del navegador (F12) para ver el error técnico detallado: ${error.message}`
    };
}


const SyncErrorBanner: React.FC<SyncErrorBannerProps> = ({ error, onClose }) => {
  if (!error) return null;

  const { title, message, suggestion } = getFriendlyError(error);

  return (
    <div className="bg-danger/10 border-l-4 border-danger text-white p-4 mb-6 rounded-r-lg shadow-lg animate-fade-in-up relative" role="alert">
      <div className="flex">
        <div className="py-1">
          <XCircle className="h-6 w-6 text-danger mr-4" />
        </div>
        <div>
          <p className="font-bold text-danger-light">{title}</p>
          <p className="text-sm text-gray-300 mt-1">{message}</p>
          {suggestion && (
            <p className="text-xs mt-2 text-gray-400">
                <b>Sugerencia:</b> <span dangerouslySetInnerHTML={{ __html: suggestion.replace(/`([^`]+)`/g, '<code class="text-xs bg-gray-900/50 p-1 rounded font-mono">$1</code>') }}></span>
            </p>
          )}
        </div>
      </div>
      <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full text-danger-light hover:bg-danger/20" aria-label="Cerrar alerta">
          <X size={18} />
      </button>
    </div>
  );
};

export default SyncErrorBanner;
