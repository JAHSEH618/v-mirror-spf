import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`theme-toggle ${theme}`}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            type="button"
        >
            <div className="toggle-track">
                <Sun className="icon-sun" />
                <Moon className="icon-moon" />
            </div>
            <div className="toggle-thumb">
                {theme === "light" ? (
                    <Sun className="thumb-icon" strokeWidth={2.5} />
                ) : (
                    <Moon className="thumb-icon" strokeWidth={2.5} />
                )}
            </div>
        </button>
    );
}
