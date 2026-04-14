import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useUndoDelete<T extends { id: string; description?: string; name?: string }>(
  deleteFn: (id: string) => Promise<void>,
  onUndo?: () => void
) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const softDelete = useCallback((item: T) => {
    setPendingId(item.id);
    const label = item.description || item.name || 'Item';

    toast(`"${label}" removido`, {
      duration: 5000,
      action: {
        label: 'Desfazer',
        onClick: () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPendingId(null);
          onUndo?.();
          toast.success('Ação desfeita!');
        },
      },
    });

    timeoutRef.current = setTimeout(async () => {
      await deleteFn(item.id);
      setPendingId(null);
    }, 5000);
  }, [deleteFn, onUndo]);

  return { softDelete, pendingId };
}
