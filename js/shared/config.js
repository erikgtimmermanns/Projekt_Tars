// Central config for kiosk and admin modules
export const OPEN_METEO = {
    latitude: 51.2277,
    longitude: 6.7735,
    timezone: 'Europe/Berlin'
};

export const RECEPTION = {
    open: '08:00',
    close: '18:00'
};

export const WEATHER_REFRESH_MS = 600000; // 10 minutes

export default {
    OPEN_METEO,
    RECEPTION,
    WEATHER_REFRESH_MS
};
