import { updateDateTime, updateReceptionStatus, updateTimeOfDayTheme } from './datetime.js';
import { updateVisitorPanel, loadVisitorProfile } from './visitor.js';
import { loadWeather, testWeather, ensureWeatherAnimator } from './weather.js';
import { initWelcome } from './welcome.js';
import { initFacts } from './facts.js';
import { initFloorplan } from './floorplan.js';

console.log('kiosk app.js loaded');

function startDashboard() {
    console.log('Dashboard wird gestartet');

    try { ensureWeatherAnimator(); } catch (e) { /* ignore */ }

    updateDateTime();
    updateReceptionStatus();
    updateTimeOfDayTheme();
    // load visitor profile (will call updateVisitorPanel when done)
    try { loadVisitorProfile(); } catch (e) { updateVisitorPanel(); }
    loadWeather();

    window.setInterval(updateDateTime, 1000);
    window.setInterval(updateReceptionStatus, 60000);
    window.setInterval(updateTimeOfDayTheme, 60000);
    window.setInterval(loadWeather, 600000);
    window.setInterval(loadVisitorProfile, 60000); // Besucherwechsel um Mitternacht und Änderungen aus dem Admin

    // expose test helpers in console
    window.testWeather = testWeather;
    window.loadWeather = loadWeather;
    // initialize optional modules
    try { initWelcome(); } catch (e) { console.warn('initWelcome failed', e); }
    try { initFacts(); } catch (e) { console.warn('initFacts failed', e); }
    try { initFloorplan(); } catch (e) { console.warn('initFloorplan failed', e); }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDashboard);
} else {
    startDashboard();
}
