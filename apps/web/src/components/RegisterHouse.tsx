import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { queryClient } from "../lib/queryClient";
import { Button } from "./ui/button";

export function RegisterHouse() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = `JMT-${Math.floor(Math.random() * 9000 + 1000)}`;
    await fetch("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, ownerName: name, address }),
    });
    setName("");
    setAddress("");
    alert("Rumah berhasil didaftarkan!");

    // Auto refresh data query agar langsung muncul di dashboard
    queryClient.invalidateQueries({ queryKey: ["houses"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });

    // Pindah ke dashboard tanpa reload
    navigate({ to: "/" });
  };

  return (
    <form
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-md flex flex-col gap-4"
      onSubmit={submit}
    >
      <h2 className="text-xl font-semibold">Daftar Rumah Baru</h2>
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
