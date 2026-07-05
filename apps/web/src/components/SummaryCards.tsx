// apps/web/src/components/SummaryCards.tsx
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

type Report = {
  totalHouses: number;
  totalContributions: number;
  totalAmount: number;
};

export function SummaryCards() {
  const { data: report, isLoading } = useQuery<Report>({
    queryKey: ["reports"],
    queryFn: () => apiClient.get<Report>("/api/reports"),
  });

  if (isLoading) return <p className="text-gray-500">Memuat laporan...</p>;

  // 1. Pastikan ini Number. Jika undefined/null, jadikan 0.
  // Ini mencegah error di saat SSR (Server-Side Rendering).
  const totalHouses = Number(report?.totalHouses ?? 0);
  const totalContributions = Number(report?.totalContributions ?? 0);
  const totalAmount = Number(report?.totalAmount ?? 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Total Rumah Terdaftar</p>
        <p className="text-2xl font-bold text-gray-800">{totalHouses}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Total Setoran Masuk</p>
        <p className="text-2xl font-bold text-gray-800">
          {totalContributions}x
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Total Dana Terkumpul</p>
        <p className="text-2xl font-bold text-green-600">
          {/* 2. Panggil toLocaleString HANYA setelah dipastikan angka */}
          Rp {totalAmount.toLocaleString("id-ID")}
        </p>
      </div>
    </div>
  );
}
