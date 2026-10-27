# Endless Moment Admin — Android APK

This project is configured to package the existing React app as a private Android application using Capacitor. The APK uses the local built web UI and connects to the configured remote API (`VITE_API_BASE_URL`), Render backend, MongoDB, and Cloudinary.

## What the Android app provides

- A normal Android status bar (time, battery, and network icons).
- The existing admin interface inside an Android app shell.
- Private APK distribution; Google Play publication is not required.
- Existing backend authentication and data services remain on the server.

## Build a debug APK on Windows

Requirements: Node.js 22+, Android Studio with Android SDK installed, and a compatible JDK (Android Studio's bundled JDK is recommended).

1. Extract this project and open a terminal in the `Endless-Moment-App-main` folder.
2. Install JavaScript dependencies:

   ```powershell
   npm install
   ```

3. Create the Android native project and sync the web app:

   ```powershell
   npx cap add android
   npm run android:sync
   ```

   If `android` already exists, skip `npx cap add android` and run `npm run android:sync`.

4. Open the Android project:

   ```powershell
   npx cap open android
   ```

5. In Android Studio, allow Gradle sync to finish, then select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
6. Android Studio shows the generated APK path, usually `android\app\build\outputs\apk\debug\app-debug.apk`.
7. Transfer that APK privately to the company's authorized admins and install it on their Android devices. Android may ask them to allow installs from that source.

## Release APK for company distribution

For long-term company distribution, create a signed release APK in Android Studio using **Build > Generate Signed Bundle / APK > APK**. Keep the signing keystore and passwords securely backed up; future updates should use the same signing key.

## Configuration and security

- `VITE_API_BASE_URL` is a public API endpoint, not a secret. Keep it pointed at the deployed Render API.
- Keep `MONGODB_URI`, `JWT_SECRET`, and `CLOUDINARY_API_SECRET` on Render only. Never embed them in the Android app.
- This app is private by distribution, but it is not restricted to company devices by APK alone. Keep server-side admin authentication enabled and distribute the APK only to authorized people.
- A phone needs internet access for server-backed login, data, and Cloudinary uploads. The app shell may open offline, but live data operations will not work without connectivity.

## Update workflow

After changing React code, run `npm run android:sync`, then rebuild the APK in Android Studio. For an existing installed app, install the new APK over the old one using the same application ID and signing key.
