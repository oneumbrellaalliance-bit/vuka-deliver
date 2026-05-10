# 📱 Vuka Deliver — Android / Google Play Guide

This is a Trusted Web Activity (TWA). Your Next.js app running on Vercel
IS the Android app. No duplicate code. When you update the website,
the app updates automatically for all users.

---

## How a TWA works

Chrome is already installed on every Android phone. A TWA is a shell app
that opens your website in Chrome in fullscreen mode — no browser bar,
no tabs, looks and feels exactly like a native app. Google Play accepts
TWAs exactly like native apps.

---

## Prerequisites

- Android Studio installed (free): https://developer.android.com/studio
- Java 17+ installed
- Your web app deployed to Vercel (get the URL first)
- A Google Play Developer account ($25 one-time): https://play.google.com/console

---

## Step 1: Update your domain in build.gradle

Open `android/app/build.gradle` and replace:

```
hostName    : "vuka-deliver.vercel.app",
defaultUrl  : "https://vuka-deliver.vercel.app/",
```

With your actual Vercel domain. If you set up a custom domain
(e.g. vuka.rw), use that instead.

---

## Step 2: Generate your signing keystore

This is your app's identity. Keep the keystore file safe — lose it
and you can never update the app on Play Store.

```bash
keytool -genkey -v \
  -keystore vuka-deliver.keystore \
  -alias vuka \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Fill in the prompts:
- First/last name: Your name or company name
- Org: Vuka Deliver Ltd
- City: Kigali
- Country: RW

Save `vuka-deliver.keystore` somewhere safe (NOT in the git repo).

---

## Step 3: Get your SHA-256 fingerprint

```bash
keytool -list -v \
  -keystore vuka-deliver.keystore \
  -alias vuka
```

Copy the SHA-256 fingerprint — it looks like:
`AB:CD:EF:12:34:...`

---

## Step 4: Update assetlinks.json

Open `public/.well-known/assetlinks.json` and replace
`REPLACE_WITH_YOUR_SHA256_FINGERPRINT` with your actual fingerprint,
removing the colons:

```json
"sha256_cert_fingerprints": [
  "ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890"
]
```

Then deploy to Vercel so this file is live at:
  https://your-domain.vercel.app/.well-known/assetlinks.json

Verify it works: https://developers.google.com/digital-asset-links/tools/generator

---

## Step 5: Configure signing in build.gradle

In `android/app/build.gradle`, update the release signingConfig:

```groovy
android {
    signingConfigs {
        release {
            storeFile file('/path/to/vuka-deliver.keystore')
            storePassword 'your_keystore_password'
            keyAlias 'vuka'
            keyPassword 'your_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

Never commit passwords to git. Use environment variables or a
local `keystore.properties` file (add to .gitignore).

---

## Step 6: Build the release APK / AAB

Open Android Studio → Open the `android/` folder as a project.

Let Gradle sync (first time takes ~5 min).

Then either:

**Option A — Android Studio UI:**
Build → Generate Signed Bundle/APK → Android App Bundle → fill in
keystore details → Release → Finish

**Option B — Command line:**
```bash
cd android
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

Google Play prefers AAB over APK.

---

## Step 7: Test on a real device first

```bash
./gradlew installDebug
```

This installs the debug build on any connected Android phone.
Check that:
- App opens fullscreen (no Chrome address bar)
- Navigation works correctly
- MTN MoMo payment flow opens correctly
- Back button behaves as expected

---

## Step 8: Submit to Google Play

1. Go to https://play.google.com/console
2. Create new app → "Vuka Deliver"
3. Fill in:
   - App name: Vuka Deliver
   - Description: Fast food and essentials delivered in Kigali in under 45 minutes
   - Category: Food & Drink
   - Content rating: Everyone
4. Upload your AAB file
5. Add screenshots (you can screenshot the demo HTML file in a browser)
6. Set price: Free
7. Submit for review

Google Play review typically takes 3-7 days for a new app.

---

## Screenshots for Play Store

You need at least 2 phone screenshots (1080×1920px minimum).

Easiest way: open `demo/vuka-deliver-demo.html` in Chrome on Android,
use Android's screenshot tool, then crop to remove browser chrome.

Required sizes:
- Phone: 2 screenshots minimum (1080×1920 or 1080×2160)
- Tablet: optional but recommended
- Feature graphic: 1024×500px (header banner)

---

## App listing copy

**Short description (80 chars):**
Order food from 18 Kigali restaurants. Delivered in 45 min.

**Full description:**
Vuka Deliver brings 18 of Kigali's best restaurants to your door — fast.

Order from Karame, Inganzo, Japanda, Casamia, Now Now Rolex, Paka,
Kings Fresh Shawarma, Pad Thai, Riders Lounge and more.

- Flat 1,000 RWF delivery fee — no container charge
- Pay with MTN Mobile Money, Airtel Money or cash
- Live order tracking
- Kigali-first · Fast · Simple

**Category:** Food & Drink
**Tags:** food delivery, kigali, rwanda, restaurant, takeaway, momo

---

## Updating the app

Because this is a TWA, most updates require ZERO app store
resubmission. You just:

1. Update your Next.js code
2. `git push` → Vercel auto-deploys
3. All users on the app see the new version immediately

You only need to resubmit to Play Store if you change:
- The package name (rw.vuka.deliver)
- Android permissions
- The splash screen or icon
- The `build.gradle` configuration

---

## Troubleshooting

**App shows browser bar instead of fullscreen:**
The assetlinks.json file is not set up correctly or the SHA-256
fingerprint doesn't match. Re-verify at:
https://developers.google.com/digital-asset-links/tools/generator

**TWA falls back to browser:**
The domain in `manifestPlaceholders.hostName` must exactly match
the domain in `assetlinks.json` and the domain your site is served from.
www.vuka.rw and vuka.rw are different — pick one.

**Payment deep link not working:**
Make sure `DeepLinkActivity` is registered in AndroidManifest.xml
and your payment provider's redirect URL is set to `vuka://payment`.

---

## File structure of the Android project

```
android/
  app/
    build.gradle              — dependencies and TWA config
    proguard-rules.pro        — code shrinking rules
    src/main/
      AndroidManifest.xml     — app manifest and intent filters
      java/rw/vuka/deliver/
        Application.kt        — app class
        DeepLinkActivity.kt   — handles payment callbacks
      res/
        drawable/splash.xml   — splash screen (replace with logo)
        values/colors.xml     — brand colours
        values/strings.xml    — app name
        values/styles.xml     — theme
        xml/file_paths.xml    — FileProvider config
  build.gradle                — project-level build config
  settings.gradle             — module config
  gradle.properties           — JVM and AndroidX settings

public/
  .well-known/
    assetlinks.json           — Digital Asset Links (CRITICAL)
```

---

## Estimated total time: 2 hours

- Step 1-4 (setup + assetlinks): 30 min
- Step 5-6 (build): 30 min
- Step 7 (device test): 20 min
- Step 8 (Play Store submission): 30 min
- Review wait: 3-7 days
