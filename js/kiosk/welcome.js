import { supabase } from "../shared/supabase.js";
import { subscribeKioskSettings, DEFAULT_HEADER_LANGUAGE } from "../shared/kiosk-settings.js";

const welcomeMessages = {
    de: { eyebrow: "HERZLICH WILLKOMMEN", headline: "In unserer Geschäftsstelle <span>Düsseldorf</span>" },
    en: { eyebrow: "WELCOME", headline: "At our office in <span>Düsseldorf</span>" }
};

export function setWelcomeLanguage(language = DEFAULT_HEADER_LANGUAGE) {
    const welcomeText = document.getElementById("eyebrow-text");
    const welcomeHeadline = document.getElementById("headline-text");
    const welcomeSubtext = document.getElementById("welcome-subtext");

    if (!welcomeText || !welcomeHeadline) {
        console.error("Header-Elemente nicht gefunden");
        return;
    }

    const current = welcomeMessages[language] || welcomeMessages[DEFAULT_HEADER_LANGUAGE];
    welcomeText.textContent = current.eyebrow;
    welcomeHeadline.innerHTML = current.headline;
    if (welcomeSubtext) welcomeSubtext.textContent = current.subtext || "";
}

export function initWelcome() {
    return subscribeKioskSettings(supabase, settings => setWelcomeLanguage(settings.headerLanguage));
}
