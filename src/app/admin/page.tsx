import { requireRole } from "@/lib/roles";

export default async function AdminPage() {
  const { s, roles } = await requireRole("/admin", "admin");

  return (
    <main className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Admin area</h1>
      <div className="bg-white border border-slate-200 p-4 rounded shadow-sm space-y-2 text-sm">
        <p><strong>Name:</strong> {s.name}</p>
        <p><strong>Login ID:</strong> {s.login_id}</p>
        <p><strong>Roles:</strong> {roles.join(", ")}</p>
      </div>
    </main>
  );
}
