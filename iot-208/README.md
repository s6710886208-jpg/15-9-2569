# ESP32 + ESPHome + Firebase RTDB + GitHub Pages

Project starter for the assignment. The supplied instructor example uses ESPHome REST requests: `PUT` to a current `latest` node and `POST` to append timestamped records in `history`. This starter keeps that flow, adds six simulated fields, and serves the live dashboard from `/freeboard/`.

## Data model

```text
/<DATABASE_ROOT>/latest
/<DATABASE_ROOT>/history/<Firebase push id>
```

Each sample contains `temperature_c`, `humidity_pct`, `light_lux`, `pressure_hpa`, `soil_moisture_pct`, `air_quality_aqi`, and `timestamp` (Unix seconds). The first six satisfy the six-column minimum. The ESPHome file has separate requests for latest and history every 10 seconds.

## 1. Set your student database name

Create a Firebase project and Realtime Database named `iot-208`, where `208` is the last three digits of your student ID. Copy the exact RTDB URL from Firebase Console. The sample RTDB data path is `/iot-208/esp32-01`; use `iot-208` consistently in the ESPHome YAML, Firebase Rules, and dashboard config.

## 2. Configure Firebase

For classroom demonstration, make only your assignment root readable/writable as in the instructor's lab-only example, and understand this allows unauthenticated access to that subtree. Do not use these open rules for a production database. In Firebase Console → Realtime Database → Rules, keep the root `iot-208` in this scoped demo rule:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "iot-208": { ".read": true, ".write": true }
  }
}
```

The rule above grants public read/write access only under your assignment root, matching the classroom demonstration example.

## 3. Configure and flash ESPHome

Copy `esphome/secrets.yaml.example` to `secrets.yaml` in your ESPHome configuration directory and add your Wi-Fi credentials. Copy `esphome/firebase-iot.yaml` there too. Replace `YOUR_DATABASE_HOST` with the hostname only (no scheme or trailing slash), and replace the `/iot-208/esp32-01` path with your root/device path. Install using ESPHome Device Builder. Keep the ESP32 powered and online during the teacher's check.

## 4. Configure the dashboard

Edit `freeboard/config.js`: set `databaseUrl` to the complete RTDB URL (for example `https://your-db.asia-southeast1.firebasedatabase.app`), and `dataPath` to your root/device path (example `/iot-208/esp32-01`). Commit and push this repository to GitHub. In repository Settings → Pages, select GitHub Actions as the deployment source. Dashboard address format: `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY/freeboard/`.

## 5. Check real-time operation

Open the dashboard and Firebase Console side by side. Within 10 seconds, `latest` should update and a new `history` record should appear. The page subscribes using Firebase's browser SDK, shows connection status and the latest values, and plots recent samples. Check ESPHome logs for HTTP 200 on both writes. HTTP 401 usually means Rules/path mismatch; a connection error commonly means Wi-Fi, DNS, TLS, or wrong database host.

## Submission

Submit only the published GitHub Pages URL ending `/freeboard/` in Classroom. GitHub Pages, Firebase, and the physical ESP32 must all be configured by the student; this workspace cannot publish to accounts or validate real device telemetry without those credentials/device details.







