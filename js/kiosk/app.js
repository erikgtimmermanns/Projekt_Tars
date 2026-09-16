import { updateDateTime, updateReceptionStatus, updateTimeOfDayTheme } from './datetime.js';
import { updateVisitorPanel } from './visitor.js';
import { loadWeather, testWeather, ensureWeatherAnimator } from './weather.js';

console.log('kiosk app.js loaded');

function startDashboard() {
    console.log('Dashboard wird gestartet');

    try { ensureWeatherAnimator(); } catch (e) { /* ignore */ }

    updateDateTime();
    updateReceptionStatus();
    updateTimeOfDayTheme();
    updateVisitorPanel();
    loadWeather();

    window.setInterval(updateDateTime, 1000);
    window.setInterval(updateReceptionStatus, 60000);
    window.setInterval(updateTimeOfDayTheme, 60000);
    window.setInterval(loadWeather, 600000);

    // expose test helpers in console
    window.testWeather = testWeather;
    window.loadWeather = loadWeather;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDashboard);
} else {
    startDashboard();
}
