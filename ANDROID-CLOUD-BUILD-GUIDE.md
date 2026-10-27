# Build the Endless Moment Admin APK without installing Android Studio

This repository includes a GitHub Actions workflow that builds a debug APK on GitHub-hosted runners. Android Studio is not required on your PC.

## One-time setup

1. Push the contents of this project to your GitHub repository (the workflow must be at `.github/workflows/build-android-apk.yml`).
2. In GitHub, open the repository's **Actions** tab.
3. If prompted, enable Actions for the repository.
4. Select **Build Android APK** from the workflow list and click **Run workflow**. A push to `main` or `master` also starts the workflow.
5. Wait until the run finishes with a green check mark. If it fails, open the run and inspect the failed step's log.
6. Open the completed workflow run, scroll to **Artifacts**, and download `endless-moment-admin-debug-apk`.
7. Extract the downloaded artifact ZIP. It contains `app-debug.apk`. Transfer the APK to the Android phone and install it. Android may ask you to allow installation from that source.

## Notes

- This creates a **debug APK** for private testing, not a signed release APK.
- GitHub Actions must be enabled and the repository must be accessible to the account running the workflow.
- The APK needs an internet connection to use the Render API, MongoDB-backed data, and Cloudinary uploads.
- Do not commit `.env` files, MongoDB connection strings, JWT secrets, or Cloudinary API secrets.
- Each new app version must be rebuilt and redistributed. The website/backend can change independently, but native Android changes require another APK build.
