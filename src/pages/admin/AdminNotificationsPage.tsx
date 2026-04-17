import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notificações</h1>
      <Card className="p-10 flex flex-col items-center text-center text-muted-foreground">
        <Bell className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">Em breve: envio de push notifications segmentado por plano e atividade.</p>
      </Card>
    </div>
  );
}
