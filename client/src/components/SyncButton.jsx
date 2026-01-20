import React, { useState } from 'react';
import axios from 'axios';
import { CloudUpload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SyncButton() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSync = async () => {
    setStatus('loading');
    try {
      // Trigger the "Full Mirror" route we created earlier
      const response = await axios.post("http://localhost:5000/sync/full-sync");
      
      if (response.data.success) {
        setStatus('success');
        // Reset to idle after 5 seconds
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (err) {
      console.error("Sync failed:", err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={status === 'loading'}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${
        status === 'loading' ? 'bg-gym-gray text-white cursor-wait' :
        status === 'success' ? 'bg-green-600 text-white' :
        status === 'error' ? 'bg-red-600 text-white' :
        'bg-gym-yellow text-gym-black hover:bg-gym-yellow-bright'
      }`}
    >
      {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
      {status === 'success' && <CheckCircle className="w-5 h-5" />}
      {status === 'error' && <AlertCircle className="w-5 h-5" />}
      {status === 'idle' && <CloudUpload className="w-5 h-5" />}
      
      {status === 'loading' ? 'Backing up...' :
       status === 'success' ? 'Cloud Updated!' :
       status === 'error' ? 'Sync Failed' :
       'Backup to Cloud'}
    </button>
  );
}