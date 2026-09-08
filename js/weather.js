async function loadWeather() {
    console.log("Loading weather data...");
    try {
        const response = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=51.2277&longitude=6.7735&current=temperature_2m,relative_humidity_2m'
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        document.getElementById('weather').innerHTML =
            `🌤 Temperatur: ${data.current.temperature_2m} °C<br>
         💧 Luftfeuchtigkeit: ${data.current.relative_humidity_2m} %`;
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}
loadWeather();
setInterval(loadWeather, 600000);