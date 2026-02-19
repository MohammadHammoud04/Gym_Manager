import { useEffect, useState } from "react";
import axios from "axios";
import { History, User, ArrowUpRight, ArrowDownLeft, Trash2, ShoppingCart } from "lucide-react";

export default function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
        try {
          const res = await axios.get("http://localhost:5000/logs");
          setLogs(res.data);
        } catch (err) {
          console.error("Error fetching logs:", err);
        }
      };
    fetchLogs();
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'DELETION': return <Trash2 className="text-red-500" size={18} />;
      case 'SALE': return <ShoppingCart className="text-green-500" size={18} />;
      case 'REFUND': return <ArrowDownLeft className="text-blue-500" size={18} />;
      default: return <ArrowUpRight className="text-gym-yellow" size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-gym-black p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-gym-yellow/10 rounded-2xl">
            <History className="w-8 h-8 text-gym-yellow" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Audit Logs</h1>
            <p className="text-gym-gray-text text-xs uppercase font-bold tracking-widest">System Activity & Security Trail</p>
          </div>
        </div>

        <div className="bg-gym-gray-dark border border-gym-gray-border rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-gym-black/50 border-b border-gym-gray-border">
              <tr className="text-[10px] font-black uppercase text-gym-gray-text tracking-widest">
                <th className="px-6 py-4 text-center">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Date/Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-gray-border/30">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex justify-center">{getIcon(log.actionType)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white mb-0.5">{log.details}</p>
                    <span className="text-[9px] bg-gym-gray-border px-1.5 py-0.5 rounded text-gym-gray-text font-black uppercase">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gym-yellow/20 flex items-center justify-center text-[10px] text-gym-yellow font-black">
                        {log.userName.charAt(0)}
                      </div>
                      <span className="text-xs text-white font-medium">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-black ${log.amount < 0 ? 'text-red-500' : log.amount > 0 ? 'text-green-500' : 'text-gym-gray-text'}`}>
                      {log.amount === 0 ? '--' : `${log.amount > 0 ? '+' : ''}$${log.amount}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs text-white font-bold">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-gym-gray-text">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}