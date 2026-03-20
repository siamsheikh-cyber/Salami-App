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
  trxId?: string;
  messages?: { _id?: string; text: string; timestamp?: string }[];
}
