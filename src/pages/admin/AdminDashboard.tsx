import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchInteractions, downloadCSV, SalamiInteraction, deleteInteraction, updateInteraction, updateInteractionStatus, updateInteractionVisibility, editMessage, deleteMessage } from "@/lib/adminService";
import { LogOut, Download, RefreshCw, Edit2, Trash2, Save, X, Eye, EyeOff, MessageSquare, Mail, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [data, setData] = useState<SalamiInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    const token = localStorage.getItem("salami_admin_token");
    if (!token) {
      navigate("/admin");
      return;
    }
    setLoading(true);
    try {
      const result = await fetchInteractions(token);
      setData(result);
    } catch (err: any) {
      toast({
        title: "Error fetching data",
        description: err.message,
        variant: "destructive",
      });
      if (err.message === "Unauthorized" || err.message === "Failed to fetch interactions") {
        localStorage.removeItem("salami_admin_token");
        navigate("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("salami_admin_token");
    navigate("/admin");
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  const [editingMsgId, setEditingMsgId] = useState<{ interactionId: string, messageId: string } | null>(null);
  const [editMsgText, setEditMsgText] = useState<string>("");

  const [selectedInteraction, setSelectedInteraction] = useState<SalamiInteraction | null>(null);
  const [isGlobalInboxOpen, setIsGlobalInboxOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this interaction?")) {
      try {
        const token = localStorage.getItem("salami_admin_token");
        await deleteInteraction(id, token!);
        setData(data.filter(item => (item._id || item.id) !== id));
        toast({ title: "Deleted", description: "Interaction removed successfully." });
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  const startEdit = (id: string, currentAmount: number) => {
    setEditingId(id);
    setEditAmount(currentAmount.toString());
  };

  const handleEditSave = async (id: string) => {
    const newAmount = parseInt(editAmount);
    if (isNaN(newAmount)) return;

    try {
      const token = localStorage.getItem("salami_admin_token");
      await updateInteraction(id, { finalSalami: newAmount }, token!);
      setData(data.map(item => (item._id || item.id) === id ? { ...item, finalSalami: newAmount } : item));
      setEditingId(null);
      toast({ title: "Updated", description: "Salami amount updated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("salami_admin_token");
      await updateInteractionStatus(id, newStatus, token!);
      setData(data.map(item => (item._id || item.id) === id ? { ...item, status: newStatus as any } : item));
      toast({ title: "Status Updated", description: `Changed status to ${newStatus}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleVisibilityChange = async (id: string, currentVisibility: boolean) => {
    try {
      const token = localStorage.getItem("salami_admin_token");
      const newVisibility = !currentVisibility;
      await updateInteractionVisibility(id, newVisibility, token!);
      setData(data.map(item => (item._id || item.id) === id ? { ...item, isPublic: newVisibility } : item));
      toast({ title: "Visibility Updated", description: newVisibility ? "Visible on Public List" : "Hidden from Public List" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEditMessage = async (interactionId: string, messageId: string) => {
    if (!editMsgText.trim()) return;
    try {
      const token = localStorage.getItem("salami_admin_token");
      await editMessage(interactionId, messageId, editMsgText, token!);
      const newData = data.map(item => {
        const id = item._id || item.id;
        if (id === interactionId && item.messages) {
          return {
            ...item,
            messages: item.messages.map(m => m._id === messageId ? { ...m, text: editMsgText } : m)
          };
        }
        return item;
      });
      setData(newData);
      if (selectedInteraction && (selectedInteraction._id || selectedInteraction.id) === interactionId) {
        setSelectedInteraction(newData.find(item => (item._id || item.id) === interactionId) || null);
      }
      setEditingMsgId(null);
      toast({ title: "Message Updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteMessage = async (interactionId: string, messageId: string) => {
    if (window.confirm("Delete this message?")) {
      try {
        const token = localStorage.getItem("salami_admin_token");
        await deleteMessage(interactionId, messageId, token!);
        const newData = data.map(item => {
          const id = item._id || item.id;
          if (id === interactionId && item.messages) {
            return {
              ...item,
              messages: item.messages.filter(m => m._id !== messageId)
            };
          }
          return item;
        });
        setData(newData);
        if (selectedInteraction && (selectedInteraction._id || selectedInteraction.id) === interactionId) {
          setSelectedInteraction(newData.find(item => (item._id || item.id) === interactionId) || null);
        }
        toast({ title: "Message Deleted" });
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  const getStatusColor = (status?: string) => {
    if (status === "Done") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (status === "Cancel") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-blue-500/10 text-blue-500 border-blue-500/20"; // Progress
  };

  const totalVisitors = data.length;
  const totalSalami = data.reduce((sum, item) => sum + (item.finalSalami || 0), 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
          <div>
            <h1 className="text-2xl font-bold emerald-text font-heading">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Salami System Interactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => downloadCSV(data)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={() => setIsGlobalInboxOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-medium shadow-sm"
            >
              <Inbox className="w-4 h-4" />
              Inbox
              {data.filter(i => i.messages && i.messages.length > 0).length > 0 && (
                <span className="bg-white text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {data.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0)}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-festive p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Visitors</p>
              <h2 className="text-3xl font-bold text-foreground mt-1">{totalVisitors}</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald/10 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="card-festive p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expected Salami</p>
              <h2 className="text-3xl font-bold gold-text mt-1">{totalSalami} ৳</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block card-festive rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Relation</th>
                  <th className="px-6 py-4">Income Option</th>
                  <th className="px-6 py-4">Income Amount</th>
                  <th className="px-6 py-4">Final Salami</th>
                  <th className="px-6 py-4">Messages</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Loading data...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No interactions found.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => {
                    const id = item._id || item.id;
                    const isEditing = editingId === id;
                    return (
                      <tr
                        key={id || index}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                          {item.visitorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.relation}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.incomeOption === 'income' ? 'bg-emerald/10 text-emerald' : 'bg-secondary text-secondary-foreground'
                            }`}>
                            {item.incomeOption === 'income' ? 'Income Based' : 'Fixed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.incomeAmount ? `${item.incomeAmount} ৳` : '-'}
                        </td>
                        <td className="px-6 py-4 font-bold gold-text whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                className="w-20 px-2 py-1 text-sm rounded bg-background border border-input text-foreground"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                              />
                              <span>৳</span>
                            </div>
                          ) : (
                            `${item.finalSalami} ৳`
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.messages && item.messages.length > 0 ? (
                            <button 
                              onClick={() => setSelectedInteraction(item)}
                              className="relative p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-2 group border border-rose-100"
                            >
                              <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              <span className="font-bold text-xs">{item.messages.length}</span>
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                              </span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40 italic text-xs">No messages</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <select
                            value={item.status || "Progress"}
                            onChange={(e) => handleStatusChange(id!, e.target.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold outline-none appearance-none cursor-pointer border text-center ${getStatusColor(item.status)}`}
                          >
                            <option value="Progress">Progress</option>
                            <option value="Done">Done</option>
                            <option value="Cancel">Cancel</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => handleEditSave(id!)} className="p-1.5 text-emerald hover:bg-emerald/10 rounded" title="Save">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded" title="Cancel">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleVisibilityChange(id!, item.isPublic !== false)} className={`p-1.5 rounded ${item.isPublic !== false ? 'text-indigo-500 hover:bg-indigo-500/10' : 'text-muted-foreground hover:bg-muted'}`} title={item.isPublic !== false ? "Hide from Public List" : "Show in Public List"}>
                                  {item.isPublic !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => startEdit(id!, item.finalSalami)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded" title="Edit">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(id!)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading data...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No interactions found.</div>
          ) : (
            data.map((item, index) => {
              const id = item._id || item.id;
              const isEditing = editingId === id;
              return (
                <div key={id || index} className="card-festive p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-base leading-tight">{item.visitorName}</h3>
                        <select
                          value={item.status || "Progress"}
                          onChange={(e) => handleStatusChange(id!, e.target.value)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold outline-none appearance-none cursor-pointer border uppercase tracking-wider text-center ${getStatusColor(item.status)}`}
                        >
                          <option value="Progress">PROGRESS</option>
                          <option value="Done">DONE</option>
                          <option value="Cancel">CANCEL</option>
                        </select>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.relation}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleEditSave(id!)} className="p-2 text-emerald hover:bg-emerald/10 rounded">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-muted-foreground hover:bg-muted rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleVisibilityChange(id!, item.isPublic !== false)} className={`p-2 rounded ${item.isPublic !== false ? 'text-indigo-500 hover:bg-indigo-500/10' : 'text-muted-foreground hover:bg-muted'}`}>
                            {item.isPublic !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button onClick={() => startEdit(id!, item.finalSalami)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(id!)} className="p-2 text-destructive hover:bg-destructive/10 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {item.messages && item.messages.length > 0 && (
                    <button 
                      onClick={() => setSelectedInteraction(item)}
                      className="mb-3 w-full flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 font-bold text-xs"
                    >
                      <Mail className="w-4 h-4" />
                      View {item.messages.length} Messages
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Income Option</p>
                      <p className="font-medium text-foreground">{item.incomeOption === 'income' ? 'Income Based' : 'Fixed'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Income Amount</p>
                      <p className="font-medium text-foreground">{item.incomeAmount ? `${item.incomeAmount} ৳` : '-'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/50 pt-3">
                    <div className="text-xs text-muted-foreground">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'}
                    </div>
                    <div className="font-bold gold-text text-lg items-end text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            className="w-16 px-2 py-1 text-sm rounded bg-background border border-input text-foreground text-right"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                          />
                          <span>৳</span>
                        </div>
                      ) : (
                        `${item.finalSalami} ৳`
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Message Modal */}
      {selectedInteraction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-background w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
             <div className="p-4 border-b border-border bg-rose-600 text-white flex items-center justify-between">
                <div>
                   <h2 className="font-bold font-heading">Messages from {selectedInteraction.visitorName}</h2>
                   <p className="text-[10px] opacity-80 uppercase tracking-widest">{selectedInteraction.relation}</p>
                </div>
                <button 
                  onClick={() => setSelectedInteraction(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
                {selectedInteraction.messages?.map((msg) => (
                  <div key={msg._id} className="flex flex-col gap-1 items-start max-w-[85%]">
                     <div className="bg-white border border-border p-3 rounded-2xl rounded-tl-none shadow-sm relative group w-full">
                        {editingMsgId?.messageId === msg._id ? (
                          <div className="space-y-2">
                             <textarea 
                              className="w-full text-xs p-2 border rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                              value={editMsgText}
                              onChange={(e) => setEditMsgText(e.target.value)}
                             />
                             <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingMsgId(null)} className="text-[10px] font-bold text-muted-foreground px-2 py-1">Cancel</button>
                                <button onClick={() => handleEditMessage(selectedInteraction._id || selectedInteraction.id!, msg._id)} className="text-[10px] font-bold text-rose-600 px-2 py-1 bg-rose-50 rounded">Save Changes</button>
                             </div>
                          </div>
                        ) : (
                          <>
                             <p className="text-sm text-foreground break-words leading-relaxed">{msg.text}</p>
                             <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                <button 
                                  onClick={() => { setEditingMsgId({ interactionId: selectedInteraction._id || selectedInteraction.id!, messageId: msg._id }); setEditMsgText(msg.text); }}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 text-xs rounded-lg transition-colors border border-blue-100 bg-white"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteMessage(selectedInteraction._id || selectedInteraction.id!, msg._id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 text-xs rounded-lg transition-colors border border-rose-100 bg-white"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                             </div>
                          </>
                        )}
                     </div>
                     <span className="text-[10px] text-muted-foreground ml-2">
                        {new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                     </span>
                  </div>
                ))}
             </div>
             <div className="p-4 bg-white border-t border-border flex justify-end">
                <button 
                  onClick={() => setSelectedInteraction(null)}
                  className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all text-sm shadow-md"
                >
                  Done
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Global Inbox Modal */}
      {isGlobalInboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
             <div className="p-4 border-b border-border bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Inbox className="w-5 h-5 text-rose-400" />
                   <h2 className="font-bold font-heading">Global Messaging Inbox</h2>
                </div>
                <button 
                  onClick={() => setIsGlobalInboxOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-slate-50">
                {data.filter(i => i.messages && i.messages.length > 0).map((interaction) => (
                  <div key={interaction._id || interaction.id} className="bg-white p-4 rounded-xl border border-border shadow-sm hover:border-rose-200 transition-all">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-600">
                              {interaction.visitorName.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800">{interaction.visitorName}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{interaction.relation}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => { setIsGlobalInboxOpen(false); setSelectedInteraction(interaction); }}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Manage All
                        </button>
                     </div>
                     <div className="space-y-2">
                        {interaction.messages?.slice(-2).map((msg) => (
                          <div key={msg._id} className="text-xs p-2 bg-slate-50 rounded border border-slate-100 group flex justify-between items-center">
                             <p className="text-slate-600 line-clamp-1 flex-1">{msg.text}</p>
                             <span className="text-[9px] text-muted-foreground shrink-0 ml-2">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        ))}
                        {interaction.messages && interaction.messages.length > 2 && (
                          <p className="text-[10px] text-center text-muted-foreground italic">
                            + {interaction.messages.length - 2} more messages
                          </p>
                        )}
                     </div>
                  </div>
                ))}
                {data.filter(i => i.messages && i.messages.length > 0).length === 0 && (
                   <div className="text-center py-20 text-muted-foreground italic">
                      Inbox is empty
                   </div>
                )}
             </div>
             <div className="p-4 bg-white border-t border-border flex justify-end">
                <button 
                  onClick={() => setIsGlobalInboxOpen(false)}
                  className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all text-sm"
                >
                  Close Inbox
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
