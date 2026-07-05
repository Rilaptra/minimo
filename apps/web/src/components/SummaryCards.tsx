import { useQuery } from "@tanstack/react-query";

type Report = {
  totalHouses: number;
  totalContributions: number;
  totalAmount: number;
};

export function SummaryCards() {
  const { data: report, isLoading } = useQuery<Report>({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      return res.json();
    },
  });

  if (isLoading) return <p className="text-gray-500">Memuat laporan...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Total Rumah Terdaftar</p>
        <p className="text-2xl font-bold text-gray-800">
          {report?.totalHouses ?? 0}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Total Setoran Masuk</p>
        <p className="text-2xl font-bold text-gray-800">
          {report?.totalContributions ?? 0}x
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Total Dana Terkumpul</p>
        <p className="text-2xl font-bold text-green-600">
          Rp {report?.totalAmount.toLocaleString("id-ID") ?? 0}
        </p>
      </div>
    </div>
  );
}
