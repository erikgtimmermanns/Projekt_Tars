import { updateDateTime, updateReceptionStatus, updateTimeOfDayTheme } from './datetime.js';
import { updateVisitorPanel, loadVisitorProfile, initVisitorRealtime, subscribeKioskVisitor } from './visitor.js';
import { loadWeather, testWeather, ensureWeatherAnimator } from './weather.js';
import { initWelcome } from './welcome.js';
import { initFacts } from './facts.js';
import { initPresentation } from './presentation.js';
import { initVisitorWelcome } from './visitor-welcome.js';
import { initTabletSelection } from '../tablet/tablet-display.js';
import { initWidgetTabletButtons } from '../tablet/seekampf-overlay.js';
import { initSeekampfOverlay } from './seekampf-overlay.js';
import { initNasaApodOverlay } from './nasa-apod-overlay.js';
import { initCoudChartOverlay } from './coud-chart-overlay.js';
import { initKioskLayout } from './layout.js';
import { initKioskWidgets } from './widget-display.js';

console.log('kiosk app.js loaded');

function startDashboard() {
    console.log('Dashboard wird gestartet');

    initKioskLayout();

    try { ensureWeatherAnimator(); } catch (e) { /* ignore */ }

    updateDateTime();
    updateReceptionStatus();
    updateTimeOfDayTheme();
    // load visitor profile (will call updateVisitorPanel and updateVisitorBtnPanel when done)
    try { loadVisitorProfile(); } catch (e) { updateVisitorPanel(); }
    try { initVisitorRealtime(); } catch (e) { console.warn('initVisitorRealtime failed', e); } // sofortige Wirkung bei Änderung der Bildschirm-Einstellung
    try { subscribeKioskVisitor(); } catch (e) { console.warn('subscribeKioskVisitor failed', e); } // sofortige Wirkung bei Änderung der Bildschirm-Einstellung

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
    try { initPresentation(); } catch (e) { console.warn('initPresentation failed', e); }
    try { initVisitorWelcome(); } catch (e) { console.warn('initVisitorWelcome failed', e); }
    try { initTabletSelection(); } catch (e) { console.warn('initTabletSelection failed', e); }
    try { initWidgetTabletButtons(); } catch (e) { console.warn('initWidgetTabletButtons failed', e); }
    try { initSeekampfOverlay(); } catch (e) { console.warn('initSeekampfOverlay failed', e); }
    try { initNasaApodOverlay(); } catch (e) { console.warn('initNasaApodOverlay failed', e); }
    try { initCoudChartOverlay(); } catch (e) { console.warn('initCoudChartOverlay failed', e); }
    try { initKioskWidgets(); } catch (e) { console.warn('initKioskWidgets failed', e); }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDashboard);
} else {
    startDashboard();
}
