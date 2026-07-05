import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { apiClient } from "../lib/apiClient";

type House = { id: number; code: string; ownerName: string; address: string };

// Tambahkan type untuk response API
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function Dashboard() {
  const { data: houses, isLoading } = useQuery<House[]>({
    queryKey: ["houses"],
    queryFn: async () => {
      // Ambil response utuh, lalu kembalikan hanya properti .data
      const res = await apiClient.get<ApiResponse<House[]>>("/api/houses");
      return res.data;
    },
  });

  if (isLoading) return <p className="text-gray-500">Memuat data rumah...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Daftar Rumah & QR Code</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {houses?.map((h: House) => (
          <div
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center"
            key={h.id}
          >
            <div className="flex justify-center mb-3">
              <QRCodeSVG
                size={150}
                value={`http://localhost:3000/api/scan/${h.code}`}
              />
            </div>
            <p className="font-bold text-lg text-gray-800">{h.code}</p>
            <p className="text-gray-600">{h.ownerName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
