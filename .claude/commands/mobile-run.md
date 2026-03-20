# Mobile Run — Start the DeutschMeister mobile app

Start the Expo development server for the mobile app.

## Arguments

$ARGUMENTS — Optional: platform to run on (android, ios, web). Default: start Expo dev server.

## Steps

1. `cd e:/Deutsch_App/deutschmeister-mobile`
2. Check if `node_modules/` exists. If not, run `npm install --legacy-peer-deps` first.
3. **IMPORTANT**: Node v24+ requires `NODE_OPTIONS=--no-experimental-strip-types` for Expo SDK 52. Always set this env var before running expo commands.
4. Run the appropriate command based on arguments:
   - No args or "start": `npm run dev`
   - "android": `npm run dev:android`
   - "ios": `npm run dev:ios`
   - "web": `npm run dev:web`
   - "clear": `NODE_OPTIONS=--no-experimental-strip-types npx expo start --clear` (clears Metro cache)
   - "build-dev": `npx eas build --profile development --platform all`
   - "build-preview": `npx eas build --profile preview --platform android`
   - "doctor": `npx expo-doctor` (check for issues)

5. Report the dev server URL and any warnings/errors.

## Prerequisites

Make sure the NestJS backend is running at the API URL configured in `.env` or `EXPO_PUBLIC_API_URL`. Default: `http://localhost:3000/api`

For Android: ensure an emulator is running or a device is connected via USB.
For iOS: requires macOS with Xcode installed.
