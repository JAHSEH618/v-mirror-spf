import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { translations, defaultLanguage } from "../translations";

const LanguageContext = createContext(undefined);

// Helper to get nested translation value
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(defaultLanguage);

    useEffect(() => {
        // Check localStorage on mount
        const savedLanguage = localStorage.getItem("language");
        if (savedLanguage && translations[savedLanguage]) {
            setLanguage(savedLanguage);
        }
    }, []);

    useEffect(() => {
        // Update localStorage when language changes
        localStorage.setItem("language", language);
        // Update html lang attribute
        document.documentElement.lang = language;
    }, [language]);

    const changeLanguage = useCallback((newLanguage) => {
        if (translations[newLanguage]) {
            setLanguage(newLanguage);
        }
    }, []);

    // Translation function with interpolation support
    const t = useCallback((key, params = {}) => {
        const currentTranslations = translations[language] || translations[defaultLanguage];
        let value = getNestedValue(currentTranslations, key);

        // Fallback to default language if key not found
        if (value === undefined) {
            value = getNestedValue(translations[defaultLanguage], key);
        }

        // Return key if still not found
        if (value === undefined) {
            return key;
        }

        // Handle interpolation (e.g., {name})
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
                return params[paramKey] !== undefined ? params[paramKey] : `{${paramKey}}`;
            });
        }

        return value;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
