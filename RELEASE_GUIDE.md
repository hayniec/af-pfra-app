# AF PFRA App Store & Play Store Release Guide

This guide provides step-by-step instructions for building, signing, and submitting the **AF PFRA** app (`com.hayniec.afpfra`) to both the **Google Play Store** (Android) and the **Apple App Store** (iOS).

---

## 1. Verification & Pre-flight Check

Before creating release bundles, verify that the web application and Capacitor assets are up-to-date and passing all tests:

```bash
# 1. Run all unit tests
npm run test

# 2. Build production assets and sync to Android & iOS native directories
npm run sync
```

---

## 2. Google Play Store (Android) Release

### Step 1: Create an Upload Keystore (One-Time Setup)
If you do not already have a release keystore, generate one using JDK `keytool`:

```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pfra-key
```

### Step 2: Configure Automatic Signing (`key.properties`)
Create a file named `key.properties` in the project root (this file is ignored by Git for security):

```properties
storeFile=../release-key.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=pfra-key
keyPassword=YOUR_KEY_PASSWORD
```

### Step 3: Generate Android App Bundle (.aab)
Google Play requires an **Android App Bundle (.aab)** for submission.

#### Option A: Command Line (Gradle)
```bash
cd android
./gradlew bundleRelease
```
The output `.aab` file will be generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

#### Option B: Android Studio
1. Open the `android` folder in **Android Studio**.
2. Go to **Build** → **Generate Signed Bundle / APK...**
3. Select **Android App Bundle** → Next.
4. Choose your `release-key.jks`, enter passwords & key alias.
5. Select `release` build variant and click **Create**.

### Step 4: Submit to Google Play Console
1. Log into your [Google Play Console](https://play.google.com/console).
2. Create a new app: **AF PFRA**.
3. Navigate to **Testing** → **Internal testing** (or **Production**).
4. Upload `app-release.aab`.
5. Complete standard app store requirements:
   - **Privacy Policy**: Link to your app privacy policy.
   - **Data Safety**: Disclose location usage (used for run tracker) and storage usage.
   - **Content Rating**: Complete questionnaire.
   - **Store Listing**: Screenshots, icon (512x512), feature graphic (1024x500), and app description.

---

## 3. Apple App Store (iOS) Release

*Note: iOS release builds require a Mac running macOS with Xcode installed.*

### Step 1: Install CocoaPods & Sync iOS Dependencies
On your Mac, run:

```bash
npm run sync:ios
cd ios/App
pod install
```

### Step 2: Open in Xcode
```bash
npx cap open ios
```
*(or double click `ios/App/App.xcworkspace` in Xcode)*

### Step 3: Configure Signing & Provisioning
1. In Xcode, select the root **App** target in the left sidebar.
2. Select the **Signing & Capabilities** tab.
3. Check **Automatically manage signing**.
4. Select your **Apple Developer Team**.
5. Verify Bundle Identifier: `com.hayniec.afpfra`.

### Step 4: Verify App Permissions (`Info.plist`)
`Info.plist` is pre-configured with location permissions required for the run tracking feature:
- `NSLocationWhenInUseUsageDescription`: Tracks running distance and pace.
- `NSLocationAlwaysAndWhenInUseUsageDescription`: Tracks running distance when running in the background.

### Step 5: Archive & Upload to App Store Connect
1. Select **Any iOS Device (arm64)** as the target device in top menu bar.
2. Go to **Product** → **Archive**.
3. Once archiving completes, the **Organizer** window opens.
4. Click **Distribute App**.
5. Select **App Store Connect** → **Upload**.
6. Follow prompts to automatically sign and submit to Apple.

### Step 6: Submit via App Store Connect
1. Log into [App Store Connect](https://appstoreconnect.apple.com).
2. Create new iOS App listing for **AF PFRA**.
3. Select the uploaded build under the **Build** section.
4. Fill out required store details (screenshots, description, privacy policy, location rationale).
5. Click **Submit for Review**.

---

## 4. Version Management

When pushing updates in the future, remember to increment version numbers in:

1. **`android/app/build.gradle`**:
   - `versionCode`: Integer increment (e.g., `8`)
   - `versionName`: Semantic version string (e.g., `"1.2.0"`)
2. **`ios/App/App.xcodeproj`** (or Xcode Target settings):
   - `MARKETING_VERSION`: `"1.2.0"`
   - `CURRENT_PROJECT_VERSION`: `"8"`
3. Run `npm run sync` after any code update before building native packages.
