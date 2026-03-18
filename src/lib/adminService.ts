export interface SalamiInteraction {
  _id?: string;
  id?: string;
  visitorName: string;
  relation: string;
  q1Option: string;
  q2Option: string;
  incomeOption: "income" | "fixed" | "";
  incomeAmount: number | null;
  finalSalami: number;
  timestamp?: string;
  status?: "Progress" | "Cancel" | "Done";
  isPublic?: boolean;
  messages?: { _id: string; text: string; timestamp: string }[];
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
      return null;
    }
    const result = await response.json();
    return result.data as SalamiInteraction;
  } catch (err) {
    console.error("Error saving interaction:", err);
    return null;
  }
};

export const addMessage = async (id: string, text: string) => {
  const response = await fetch(`${API_BASE}/interactions/${id}/message`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to add message");
  return response.json();
};

export const editMessage = async (id: string, messageId: string, text: string, token: string) => {
  const response = await fetch(`${API_BASE}/admin/interactions/${id}/message/${messageId}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to update message");
  return response.json();
};

export const deleteMessage = async (id: string, messageId: string, token: string) => {
  const response = await fetch(`${API_BASE}/admin/interactions/${id}/message/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to delete message");
  return response.json();
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

export const fetchPublicInteractions = async () => {
  const response = await fetch(`${API_BASE}/public/interactions`);
  if (!response.ok) throw new Error("Failed to fetch public interactions");
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

export const deleteInteraction = async (id: string, token: string) => {
  const response = await fetch(`${API_BASE}/admin/interactions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to delete interaction");
};

export const updateInteraction = async (id: string, data: Partial<SalamiInteraction>, token: string) => {
  const response = await fetch(`${API_BASE}/admin/interactions/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to update interaction");
  return response.json();
};

export const updateInteractionStatus = async (id: string, status: string, token: string) => {
  const response = await fetch(`${API_BASE}/admin/interactions/${id}/status`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error("Failed to update status");
  return response.json();
};

export const updateInteractionVisibility = async (id: string, isPublic: boolean, token: string) => {
  const response = await fetch(`${API_BASE}/admin/interactions/${id}/visibility`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ isPublic })
  });
  if (!response.ok) throw new Error("Failed to update visibility");
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
    "Status",
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
      `"${row.status || 'Progress'}"`,
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
