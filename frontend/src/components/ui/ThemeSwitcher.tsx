import { Button } from "@radix-ui/themes";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";

interface ThemeSwitcherProps {
  appearance: "dark" | "light" | "inherit";
  onToggle: () => void;
}

export function ThemeSwitcher({ appearance, onToggle }: ThemeSwitcherProps) {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      className="flex items-center mr-0.5"
      aria-label={`Switch to ${appearance === "dark" ? "light" : "dark"} mode`}
    >
      {appearance === "dark" ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </Button>
  );
}
