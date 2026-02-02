// Note: lucide-react removed - using emoji for icons
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
                <span className="icon-sun">☀️</span>
                <span className="icon-moon">🌙</span>
            </div>
            <div className="toggle-thumb">
                {theme === "light" ? (
                    <span className="thumb-icon">☀️</span>
                ) : (
                    <span className="thumb-icon">🌙</span>
                )}
            </div>
        </button>
    );
}

