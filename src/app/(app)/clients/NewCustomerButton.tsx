import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CustomerFormModal } from "./CustomerFormModal";

export function NewCustomerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icon name="plus" className="h-4 w-4" />
        Nouveau client
      </Button>
      <CustomerFormModal open={open} onClose={() => setOpen(false)} onSaved={() => router.refresh()} />
    </>
  );
}
