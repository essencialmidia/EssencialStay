import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../app/theme-provider";
import { Button } from "../ui/button";
import { Tooltip } from "../ui/tooltip";

const options = [
  { value: "system" as const, label: "Tema do sistema", icon: Monitor },
  { value: "light" as const, label: "Tema claro", icon: Sun },
  { value: "dark" as const, label: "Tema escuro", icon: Moon },
];

export function ThemeSelector() {
  const { preference, setTheme } = useTheme();
  const currentIndex = options.findIndex((option) => option.value === preference);
  const current = options[currentIndex];
  const Icon = current.icon;

  return (
    <Tooltip content={`${current.label}. Clique para alternar.`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setTheme(options[(currentIndex + 1) % options.length].value)}
        aria-label={`${current.label}. Alternar tema.`}
      >
        <Icon className="size-[18px]" />
      </Button>
    </Tooltip>
  );
}
