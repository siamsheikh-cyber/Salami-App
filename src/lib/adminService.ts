export interface SalamiInteraction {
  id?: string;
  visitorName: string;
  relation: string;
  q1Option: string;
  q2Option: string;
  incomeOption: "income" | "fixed" | "";
  incomeAmount: number | null;
  finalSalami: number;
  timestamp?: string;
}

// Automatically use localhost for development and relative path for Vercel production.
// This prevents CORS issues and the unexpected HTML token error.
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';

export const saveInteraction = async (data: SalamiInteraction) => {
  try {
    const response = await fetch(`${API_BASE}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error("Failed to save interaction");
    }
  } catch (err) {
    console.error("Error saving interaction:", err);
  }
};

export const fetchInteractions = async (token: string): Promise<SalamiInteraction[]> => {
  const response = await fetch(`${API_BASE}/admin/interactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch interactions");
  }
  return response.json();
};

export const loginAdmin = async (username: string, password: string): Promise<{ token: string }> => {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error("Invalid credentials");
  }
  return response.json();
};

export const downloadCSV = (data: SalamiInteraction[]) => {
  const headers = [
    "Name",
    "Relation",
    "Q1 Answer",
    "Q2 Answer",
    "Income Option",
    "Income Amount",
    "Final Salami",
    "Time",
  ];
  
  const csvRows = [headers.join(",")];
  
  data.forEach(row => {
    const r = [
      `"${row.visitorName}"`,
      `"${row.relation}"`,
      `"${row.q1Option}"`,
      `"${row.q2Option}"`,
      `"${row.incomeOption}"`,
      row.incomeAmount ? row.incomeAmount.toString() : "N/A",
      row.finalSalami.toString(),
      `"${new Date(row.timestamp || "").toLocaleString()}"`
    ];
    csvRows.push(r.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", `salami-interactions-${new Date().getTime()}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
