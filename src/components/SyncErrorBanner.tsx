import React from 'react';
import { XCircle, X } from 'lucide-react';

interface SyncErrorBannerProps {
  error: Error | null;
  onClose: () => void;
}

const SyncErrorBanner: React.FC<SyncErrorBannerProps> = ({ error, onClose }) => {
  if (!error) return null;

  let friendlyMessage = 'Ha ocurrido un error inesperado al intentar sincronizar los datos. Por favor, revisa la consola para más detalles.';
  if(error.message.includes('permission-denied') || error.message.includes('false')) {
      friendlyMessage = 'El acceso a la base de datos fue denegado. Es muy probable que las reglas de seguridad de Cloud Firestore no estén configuradas para permitir lecturas o escrituras.';
  } else if (error.message.includes('offline')) {
      friendlyMessage = 'No se puede realizar la operación. Parece que estás desconectado.';
  }

  return (
    <div className="bg-danger/10 border-l-4 border-danger text-white p-4 mb-6 rounded-r-lg shadow-lg animate-fade-in-up relative" role="alert">
      <div className="flex">
        <div className="py-1">
          <XCircle className="h-6 w-6 text-danger mr-4" />
        </div>
        <div>
          <p className="font-bold text-danger-light">Error de Sincronización con la Nube</p>
          <p className="text-sm text-gray-300 mt-1">{friendlyMessage}</p>
          <p className="text-xs mt-2 text-gray-400">
            <b>Solución Sugerida:</b> Ve a tu proyecto en Firebase, navega a Cloud Firestore &rarr; Reglas, y asegúrate de que permitan el acceso. Para desarrollo, puedes usar: 
            <code className="text-xs bg-gray-900/50 p-1 rounded font-mono">allow read, write: if true;</code>
          </p>
        </div>
      </div>
      <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full text-danger-light hover:bg-danger/20" aria-label="Cerrar alerta">
          <X size={18} />
      </button>
    </div>
  );
};

export default SyncErrorBanner;
