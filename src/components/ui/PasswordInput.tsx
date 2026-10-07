import { useState, type ComponentProps } from "react";
import { Icon } from "./Icon";
import { inputClass } from "./FormField";

/**
 * Champ mot de passe avec un bouton « œil » pour afficher ou masquer la
 * saisie. S'utilise comme un `<input>` : `{...register("motDePasse")}`
 * fonctionne tel quel (la `ref` est transmise au champ).
 */
export function PasswordInput({ className = "", ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={`${inputClass} pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        title={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        <Icon name={visible ? "eyeOff" : "eye"} className="h-4 w-4" />
      </button>
    </div>
  );
}
