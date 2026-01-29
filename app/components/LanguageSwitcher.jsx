import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { languages } from "../translations";

export function LanguageSwitcher() {
    const { language, changeLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentLanguage = languages.find(l => l.code === language);

    return (
        <div className="language-switcher" ref={dropdownRef}>
            <button
                className="language-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select language"
                type="button"
            >
                <Globe size={18} />
                <span className="language-code">{currentLanguage?.code.toUpperCase()}</span>
            </button>

            {isOpen && (
                <div className="language-dropdown">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            className={`language-option ${language === lang.code ? 'active' : ''}`}
                            onClick={() => {
                                changeLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            type="button"
                        >
                            <span className="language-native">{lang.nativeName}</span>
                            <span className="language-name">{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
