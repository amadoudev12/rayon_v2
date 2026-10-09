import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ImportProductsModal } from "./ImportProductsModal";

export function ImportProductsButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Icon name="upload" className="h-4 w-4" />
        Importer un fichier Excel
      </Button>
      <ImportProductsModal open={open} onClose={() => setOpen(false)} onImported={() => router.refresh()} />
    </>
  );
}
