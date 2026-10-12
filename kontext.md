# Projekt_Tars
## Einleitung
Ziel des Projektes ist es, eine Webpage zu bauen, die auf einer Stehle mit 1080x1920 hochkant Auflösung ausgestrahlt wird. Dazu gibt es eine Admin Seite mit Supabase Login und Besucherkonfiguration. Die Webseite wird von einem Raspberry Pi bereitgestellt, der außerdem den die kiosk-Seite im Webbrowser öffnet.
### visitor_panel
Das visitor_panel ist der Bereich auf dem Display, der vorkonfigurierte Besucher anzeigt und sie willkommen heißt. Er beinhaltet einen Begrüßungstext mit dem Namen des Besuchers, das Logo des Besuchers. Auf der Adminseite sollen Besucher angelegt und gespeichert werden können. Gespeichert werden sie auf Supabase Datenbank.  
### touch_panel
Eine Webseite, die auf einem Tablet gezeigt wird und Besucher im kleinen Format anzeigt. Beim drücken auf einen Besucher wird der Kiosk-Display verwandelt und Raumbelegung für den spezifischen Besucher angezeigt. Tablet, auf dem das touch_panel gezeigt wird ist im selben Netzwerk als ldie Stehle. 
## Tech-Stack
Python 3.14.6, html, js, css, Supabase, flask
