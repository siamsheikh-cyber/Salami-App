import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "@/lib/adminService";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await loginAdmin(username, password);
      localStorage.setItem("salami_admin_token", token);
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="card-festive w-full max-w-sm p-6 md:p-8 animate-fade-in">
        <h1 className="text-2xl font-bold emerald-text text-center font-heading mb-6">
          Admin Portal
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-festive w-full text-lg py-3 rounded-xl mt-4 font-heading"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
