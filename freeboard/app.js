import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const config = window.IOT_CONFIG || {};
const fieldMeta = {
  temperature_c: { digits: 1, unit: "°C", min: 20, max: 40 },
  humidity_pct: { digits: 1, unit: "%", min: 0, max: 100 },
  light_lux: { digits: 0, unit: "lx", min: 0, max: 1000 },
  pressure_hpa: { digits: 1, unit: "hPa", min: 980, max: 1040 },
  soil_moisture_pct: { digits: 1, unit: "%", min: 0, max: 100 },
  air_quality_aqi: { digits: 0, unit: "AQI", min: 0, max: 200 }
};
const statusLight = document.querySelector("#status-light");
const canvas = document.querySelector("#history-chart");
const ctx = canvas.getContext("2d");
let latestSample = null;
let historySamples = [];

function setConnection(ok, label, detail) {
  statusLight.className = `status-light ${ok ? "ok" : "error"}`;
  document.querySelector("#connection-label").textContent = label;
  document.querySelector("#connection-detail").textContent = detail;
  document.querySelector("#sync-state").textContent = ok ? "CONNECTED" : "OFFLINE";
}

function renderLatest(data) {
  if (!data || typeof data !== "object") return;
  latestSample = data;
  for (const [key, meta] of Object.entries(fieldMeta)) {
    const value = Number(data[key]);
    const target = document.querySelector(`[data-field="${key}"]`);
    if (!Number.isFinite(value)) continue;
    target.innerHTML = `${value.toFixed(meta.digits)}<small>${meta.unit}</small>`;
    const pct = Math.max(3, Math.min(100, ((value - meta.min) / (meta.max - meta.min)) * 100));
    document.querySelector(`[data-meter="${key}"]`).style.width = `${pct}%`;
  }
  const stamp = Number(data.timestamp);
  if (Number.isFinite(stamp)) {
    const date = new Date(stamp * 1000);
    document.querySelector("#last-seen").textContent = `Last sample · ${date.toLocaleString()}`;
    document.querySelector("#update-age").textContent = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  document.querySelector("#connection-detail").textContent = "Receiving live updates";
  document.querySelector("#sample-count").textContent = String(historySamples.length || 1);
  updateSummary();
}

function updateSummary() {
  const temps = historySamples.map(x => Number(x.temperature_c)).filter(Number.isFinite);
  const humidities = historySamples.map(x => Number(x.humidity_pct)).filter(Number.isFinite);
  if (!temps.length && Number.isFinite(Number(latestSample?.temperature_c))) temps.push(Number(latestSample.temperature_c));
  if (!humidities.length && Number.isFinite(Number(latestSample?.humidity_pct))) humidities.push(Number(latestSample.humidity_pct));
  if (temps.length) document.querySelector("#range-temp").textContent = `${Math.min(...temps).toFixed(1)}–${Math.max(...temps).toFixed(1)} °C`;
  if (humidities.length) document.querySelector("#avg-humidity").textContent = `${(humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1)}%`;
  document.querySelector("#sample-count").textContent = String(historySamples.length || (latestSample ? 1 : 0));
}

function renderChart() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, rect.width * scale);
  canvas.height = Math.max(1, rect.height * scale);
  ctx.scale(scale, scale);
  const w = rect.width, h = rect.height;
  ctx.clearRect(0, 0, w, h);
  const items = [...historySamples].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  const vals = items.map(x => Number(x.temperature_c)).filter(Number.isFinite);
  document.querySelector("#chart-empty").style.display = vals.length ? "none" : "grid";
  if (!vals.length) return;
  const pad = { l: 31, r: 12, t: 15, b: 20 };
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
  const x = i => pad.l + (vals.length === 1 ? 0.5 : i / (vals.length - 1)) * (w - pad.l - pad.r);
  const y = v => pad.t + (1 - (v - min) / (max - min || 1)) * (h - pad.t - pad.b);
  ctx.font = "9px DM Mono, monospace";
  ctx.textAlign = "right";
  for (let i = 0; i < 4; i++) {
    const gy = pad.t + i * (h - pad.t - pad.b) / 3;
    const label = (max - i * (max - min) / 3).toFixed(1);
    ctx.fillStyle = "#60738b";
    ctx.fillText(`${label}°`, pad.l - 7, gy + 3);
    ctx.strokeStyle = "#1a293b";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(w - pad.r, gy); ctx.stroke();
  }
  const gradient = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  gradient.addColorStop(0, "rgba(205,245,123,.19)");
  gradient.addColorStop(1, "rgba(205,245,123,0)");
  ctx.beginPath();
  vals.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
  ctx.lineTo(x(vals.length - 1), h - pad.b); ctx.lineTo(x(0), h - pad.b); ctx.closePath();
  ctx.fillStyle = gradient; ctx.fill();
  ctx.beginPath();
  vals.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
  ctx.strokeStyle = "#c9ed82"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
  const last = vals.length - 1;
  ctx.beginPath(); ctx.arc(x(last), y(vals[last]), 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#d8f6a0"; ctx.fill(); ctx.strokeStyle = "#13251c"; ctx.lineWidth = 2; ctx.stroke();
}

function connect() {
  if (!config.databaseUrl || config.databaseUrl.includes("YOUR_FIREBASE_DATABASE_URL") || !config.dataPath) {
    setConnection(false, "Dashboard needs setup", "Edit freeboard/config.js with your RTDB URL and database path");
    document.querySelector("#last-seen").textContent = "Add your Firebase project details to begin";
    return;
  }
  try {
    const app = initializeApp({ databaseURL: config.databaseUrl });
    const db = getDatabase(app);
    onValue(ref(db, ".info/connected"), snap => {
      const online = snap.val() === true;
      if (online) setConnection(true, "Connected to Firebase", latestSample ? "Receiving live updates" : "Waiting for device sample");
      else setConnection(false, "Reconnecting to Firebase", "Checking database connection");
    }, error => setConnection(false, "Firebase connection error", error.message));
    onValue(ref(db, `${config.dataPath}/latest`), snap => {
      const value = snap.val();
      if (value) renderLatest(value);
      else document.querySelector("#connection-detail").textContent = "Connected · waiting for latest data";
    }, error => setConnection(false, "Cannot read latest data", error.message));
    const maxItems = Math.max(12, Math.min(200, Number(config.historyLimit) || 48));
    onValue(query(ref(db, `${config.dataPath}/history`), limitToLast(maxItems)), snap => {
      const value = snap.val() || {};
      historySamples = Object.values(value).filter(x => x && typeof x === "object");
      document.querySelector("#sample-count").textContent = String(historySamples.length || (latestSample ? 1 : 0));
      updateSummary();
      renderChart();
    }, error => setConnection(false, "Cannot read history", error.message));
  } catch (error) {
    setConnection(false, "Firebase setup error", error.message);
  }
}

function updateClock() {
  document.querySelector("#clock").textContent = new Date().toLocaleTimeString([], { hour12: false });
}
window.addEventListener("resize", renderChart);
updateClock();
setInterval(updateClock, 1000);
renderChart();
connect();





