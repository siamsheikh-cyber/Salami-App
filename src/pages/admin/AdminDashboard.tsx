import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchInteractions, downloadCSV, SalamiInteraction } from "@/lib/adminService";
import { LogOut, Download, RefreshCw } from "lucide-react";
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

        <div className="card-festive rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Relation</th>
                  <th className="px-6 py-4">Income Option</th>
                  <th className="px-6 py-4">Income Amount</th>
                  <th className="px-6 py-4">Final Salami</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Loading data...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No interactions found.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr 
                      key={item.id || index} 
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
                        {item.finalSalami} ৳
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
