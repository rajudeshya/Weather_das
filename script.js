const API_KEY = "YOUR_API_KEY";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const themeBtn = document.getElementById("themeBtn");

const weatherContainer =
    document.getElementById("weatherContainer");

const forecast =
    document.getElementById("forecast");

const error =
    document.getElementById("error");

const loading =
    document.getElementById("loading");

const modeNotice =
    document.getElementById("modeNotice");


// ==========================
// Search Weather
// ==========================

searchBtn.addEventListener("click", () => {

    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    if (!hasApiKey()) {
        showDemoWeather(city);
        return;
    }

    getWeatherByCity(city);
});


cityInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        searchBtn.click();
    }

});


// ==========================
// Get Weather By City
// ==========================

async function getWeatherByCity(city) {

    if (!hasApiKey()) {
        showDemoWeather(city);
        return;
    }

    const url =
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    try {

        showLoading();
        modeNotice.textContent = "";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("City not found.");
        }

        const data = await response.json();

        displayCurrentWeather(data);

        await getForecast(data.coord.lat, data.coord.lon);

    } catch (err) {

        showError(err.message);

    } finally {

        hideLoading();

    }
}


// ==========================
// Current Weather
// ==========================

function displayCurrentWeather(data) {

    error.textContent = "";

    weatherContainer.classList.remove("hidden");

    document.getElementById("cityName").textContent =
        `${data.name}, ${data.sys.country}`;

    document.getElementById("date").textContent =
        new Date().toLocaleString();

    document.getElementById("weatherAdvice").textContent =
        createWeatherAdvice(data.main.temp, data.weather[0].description);

    document.getElementById("temperature").textContent =
        `${Math.round(data.main.temp)}°C`;

    document.getElementById("description").textContent =
        data.weather[0].description;

    document.getElementById("humidity").textContent =
        `${data.main.humidity}%`;

    document.getElementById("wind").textContent =
        `${data.wind.speed} m/s`;

    document.getElementById("feelsLike").textContent =
        `${Math.round(data.main.feels_like)}°C`;

    document.getElementById("maxTemp").textContent =
        `${Math.round(data.main.temp_max)}°C`;

    document.getElementById("minTemp").textContent =
        `${Math.round(data.main.temp_min)}°C`;

    document.getElementById("visibility").textContent =
        `${(data.visibility / 1000).toFixed(1)} km`;

    document.getElementById("sunrise").textContent =
        formatTime(data.sys.sunrise);

    document.getElementById("sunset").textContent =
        formatTime(data.sys.sunset);

    document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    document.getElementById("weatherIcon").alt =
        data.weather[0].description;
}


// ==========================
// 5-Day Forecast
// ==========================

async function getForecast(lat, lon) {

    const url =
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    try {

        modeNotice.textContent = "";
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to load forecast.");
        }

        const data = await response.json();

        displayForecast(data);

    } catch (err) {

        showError(err.message);

    }
}


function displayForecast(data) {

    forecast.innerHTML = "";

    // Pick the 12 PM forecast from each day
    const dailyData = data.list
        .reduce((days, item) => {
            const day = item.dt_txt.slice(0, 10);

            if (!days.has(day)) {
                days.set(day, item);
                return days;
            }

            const currentDistance = Math.abs(new Date(item.dt * 1000).getHours() - 12);
            const savedDistance = Math.abs(new Date(days.get(day).dt * 1000).getHours() - 12);

            if (currentDistance < savedDistance) {
                days.set(day, item);
            }

            return days;
        }, new Map())
        .values();

    Array.from(dailyData).slice(0, 5).forEach(day => {

        const date = new Date(day.dt * 1000);

        const card =
            document.createElement("div");

        card.className = "forecast-card";

        const title = document.createElement("h3");
        title.textContent = date.toLocaleDateString("en-US", { weekday: "short" });

        const icon = document.createElement("img");
        icon.src = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
        icon.alt = day.weather[0].description;

        const temperature = document.createElement("p");
        temperature.className = "forecast-temp";
        temperature.textContent = `${Math.round(day.main.temp)}°C`;

        const description = document.createElement("p");
        description.textContent = day.weather[0].description;

        const humidity = document.createElement("p");
        humidity.textContent = `Humidity ${day.main.humidity}%`;

        card.append(title, icon, temperature, description, humidity);

        forecast.appendChild(card);

    });
}


// ==========================
// My Location
// ==========================

locationBtn.addEventListener("click", () => {

    if (!navigator.geolocation) {

        showError("Geolocation is not supported.");

        return;
    }

    showLoading();

    navigator.geolocation.getCurrentPosition(

        position => {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            getWeatherByCoordinates(lat, lon);

        },

        () => {

            hideLoading();

            showError(
                "Unable to access your location."
            );

        }

    );

});


async function getWeatherByCoordinates(lat, lon) {

    if (!hasApiKey()) {
        hideLoading();
        showDemoWeather("Your Location");
        return;
    }

    const url =
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to get weather.");
        }

        const data = await response.json();

        displayCurrentWeather(data);

        await getForecast(lat, lon);

    } catch (err) {

        showError(err.message);

    } finally {

        hideLoading();

    }
}


// ==========================
// Dark / Light Mode
// ==========================

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {

        themeBtn.textContent = "☀️";
        themeBtn.setAttribute("aria-label", "Switch to light theme");

        localStorage.setItem("theme", "dark");

    } else {

        themeBtn.textContent = "🌙";
        themeBtn.setAttribute("aria-label", "Switch to dark theme");

        localStorage.setItem("theme", "light");

    }

});


if (localStorage.getItem("theme") === "dark") {

    document.body.classList.add("dark");

    themeBtn.textContent = "☀️";
    themeBtn.setAttribute("aria-label", "Switch to light theme");

}


if (!hasApiKey()) {
    showDemoWeather("Berlin");
}


// ==========================
// Helpers
// ==========================

function hasApiKey() {

    return API_KEY && API_KEY !== "YOUR_API_KEY";

}

function formatTime(timestamp) {

    return new Date(timestamp * 1000)
        .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

}


function showError(message) {

    error.textContent = `⚠️ ${message}`;

}


function showDemoWeather(city) {

    const demoWeather = createDemoWeather(city);

    error.textContent = "";
    modeNotice.textContent = "Demo mode - add an OpenWeatherMap API key in script.js for live weather.";
    weatherContainer.classList.remove("hidden");
    displayCurrentWeather(demoWeather.current);
    displayForecast(demoWeather.forecast);

}


function createDemoWeather(city) {

    const today = new Date();
    const descriptions = ["Partly cloudy", "Clear sky", "Light rain", "Sunny", "Cloudy"];
    const icons = ["02d", "01d", "10d", "01d", "03d"];
    const list = descriptions.map((description, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        date.setHours(12, 0, 0, 0);

        return {
            dt: Math.floor(date.getTime() / 1000),
            dt_txt: date.toISOString().slice(0, 19).replace("T", " "),
            main: {
                temp: 22 - index,
                humidity: 56 + index * 3
            },
            weather: [{ description, icon: icons[index] }]
        };
    });

    return {
        current: {
            name: city || "Your City",
            sys: { country: "DE", sunrise: Date.now() / 1000 - 21600, sunset: Date.now() / 1000 + 21600 },
            main: { temp: 22, humidity: 56, feels_like: 21, temp_max: 24, temp_min: 17 },
            visibility: 10000,
            wind: { speed: 3.6 },
            weather: [{ description: "Partly cloudy", icon: "02d" }]
        },
        forecast: { list }
    };

}


function showLoading() {

    loading.classList.remove("hidden");

}


function hideLoading() {

    loading.classList.add("hidden");

}


function createWeatherAdvice(temperature, description) {

    const lowerDescription = description.toLowerCase();

    if (lowerDescription.includes("rain")) {
        return "Keep an umbrella close today.";
    }

    if (temperature < 10) {
        return "A warm layer will make the day more comfortable.";
    }

    if (temperature > 27) {
        return "Light clothes and a little extra water are a good idea.";
    }

    if (lowerDescription.includes("clear") || lowerDescription.includes("sun")) {
        return "A lovely day to spend some time outside.";
    }

    return "Comfortable conditions for getting out and about.";

}