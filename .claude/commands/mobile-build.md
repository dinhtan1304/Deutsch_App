# Mobile Build — Build the mobile app for distribution

Build the DeutschMeister mobile app using EAS Build or local builds.

## Arguments

$ARGUMENTS — Build target: "dev", "preview", "production", "apk", "local"

## Process

### 1. Pre-build Checks
Run in `e:/Deutsch_App/deutschmeister-mobile/`:
- Verify `app.json` has correct version and buildNumber
- Run `npx tsc --noEmit` — abort if type errors exist
- Run `npx expo-doctor` — warn about any issues
- Check that `.env` / environment variables are set correctly for the target

### 2. Build Commands

Based on arguments:

- **"dev"** — Development build (requires dev-client):
  ```bash
  npx eas build --profile development --platform android
  ```

- **"preview"** — Internal testing build (APK or Ad-Hoc):
  ```bash
  npx eas build --profile preview --platform android
  ```

- **"production"** — Production build for store submission:
  ```bash
  npx eas build --profile production --platform android
  ```

- **"apk"** — Quick APK for testing (preview profile, Android only):
  ```bash
  npx eas build --profile preview --platform android
  ```

- **"local"** — Local build (no EAS, requires Android SDK):
  ```bash
  NODE_OPTIONS=--no-experimental-strip-types npx expo run:android
  ```

- **"ios"** — iOS build (requires macOS):
  ```bash
  npx eas build --profile production --platform ios
  ```

### 3. EAS Configuration
If `eas.json` doesn't exist, create it:
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 4. Post-build
- Report the build URL from EAS
- If local build, report the APK/IPA path
- Suggest next steps (install on device, submit to store, etc.)

## Environment Variables for Builds
EAS builds use `eas.json` env or `.env` files. Ensure `EXPO_PUBLIC_API_URL` is set to the production API URL for production builds.
