import { Card } from "@/components/ui/card";
import { ADMIN_EMAILS } from "@/components/admin/AdminGuard";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Card className="p-5">
        <h2 className="font-bold mb-3">Administradores</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Para adicionar/remover admins, edite a lista <code className="px-1 bg-muted rounded">ADMIN_EMAILS</code> em
          <code className="px-1 bg-muted rounded ml-1">src/components/admin/AdminGuard.tsx</code>.
        </p>
        <ul className="space-y-1 text-sm">
          {ADMIN_EMAILS.map((email) => (
            <li key={email} className="px-3 py-2 bg-muted rounded">{email}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
