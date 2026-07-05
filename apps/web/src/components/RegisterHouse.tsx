import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { apiClient } from "../lib/apiClient";
import { queryClient } from "../lib/queryClient";
import { Button } from "./ui/button";

export function RegisterHouse() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // Tidak perlu kirim code, backend yang generate!
      await apiClient.post("/api/houses", { ownerName: name, address });

      setName("");
      setAddress("");

      // Auto refresh data query
      queryClient.invalidateQueries({ queryKey: ["houses"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });

      navigate({ to: "/" });
    } catch (err) {
      setError((err as Error).message || "Gagal mendaftarkan rumah");
    }
  };

  return (
    <form
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-md flex flex-col gap-4"
      onSubmit={submit}
    >
      <h2 className="text-xl font-semibold">Daftar Rumah Baru</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Nama Pemilik
        </label>
        <input
          className="w-full p-2 border rounded-md"
          id="name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Budi"
          required
          value={name}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="address">
          Alamat
        </label>
        <input
          className="w-full p-2 border rounded-md"
          id="address"
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Jl. Melati No. 1"
          required
          value={address}
        />
      </div>
      <Button className="mt-2" type="submit">
        Generate QR
      </Button>
    </form>
  );
}
