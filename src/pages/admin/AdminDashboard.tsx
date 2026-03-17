import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchInteractions, downloadCSV, SalamiInteraction, deleteInteraction, updateInteraction, updateInteractionStatus, updateInteractionVisibility } from "@/lib/adminService";
import { LogOut, Download, RefreshCw, Edit2, Trash2, Save, X, Eye, EyeOff } from "lucide-react";
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.incomeOption === 'income' ? 'bg-emerald/10 text-emerald' : 'bg-secondary text-secondary-foreground'
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
                  )})
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
            )})
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
