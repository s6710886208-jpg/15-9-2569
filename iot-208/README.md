# ESP32 + ESPHome + Firebase RTDB + GitHub Pages

This project uses the instructor's REST pattern: ESPHome sends the current sample with `PUT` to `latest`, then appends each reading with `POST` to `history`. The Firebase project display name and data root are `iot-208`, using the final three digits of student ID `6710886208`.

## Resources already created

- Firebase project display name: `iot-208`
- Firebase project ID: `iot-208-6710886208` (the project ID `iot-208` was already registered in a different Google account)
- Realtime Database location: Singapore (`asia-southeast1`)
- Realtime Database URL: `https://iot-208-6710886208-default-rtdb.asia-southeast1.firebasedatabase.app`
- Data root: `/iot-208/esp32-01`
- GitHub repository: `https://github.com/s6710886208-jpg/15-9-2569`
- Dashboard route: `/15-9-2569/freeboard/`

## Data model

```text
/iot-208/esp32-01/latest
/iot-208/esp32-01/history/<Firebase push id>
```

Each reading has six simulated fields: `temperature_c`, `humidity_pct`, `light_lux`, `pressure_hpa`, `soil_moisture_pct`, and `air_quality_aqi`, plus a Unix `timestamp`.

## Database security

The Realtime Database rules have been deployed. Global read/write access is denied; unauthenticated dashboard reads and ESPHome writes are allowed only below `/iot-208/esp32-01`:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "iot-208": {
      "esp32-01": { ".read": true, ".write": true }
    }
  }
}
```

Anyone who knows the database URL can read, replace, or append data under that device node. This is intended for the classroom demo. Do not use the rule for a production database. To close access again, restore the locked rules.

## ESPHome setup

Copy `esphome/secrets.yaml.example` to `secrets.yaml` in your ESPHome configuration and enter Wi-Fi credentials. Copy `esphome/firebase-iot.yaml`, then flash it using ESPHome Device Builder. The YAML contains the assigned database URL and path already. Keep the ESP32 powered and online during the teacher's check.

## GitHub Pages

The workflow publishes only the `freeboard` folder under the `/freeboard/` route. Pages is set to use GitHub Actions. Once its deployment succeeds, the URL is `https://s6710886208-jpg.github.io/15-9-2569/freeboard/`.

The dashboard subscribes to Firebase live updates and shows the latest values, history chart, connection status, and summary statistics. After the database rule is changed and the ESP32 connects, verify that `latest` and a new `history` record appear in Firebase Console every 10 seconds.

