# AI Coding Instructions - Gestão de Inventário Frontend

## 🎯 Critical: Team Roles & Responsibilities

**THIS PROJECT HAS SPLIT RESPONSIBILITIES. ALWAYS distinguish between React and Platform Engineering tasks.**

### Hassan (React Developer)
- Controls 100% of `src/` folder (screens, components, React logic)
- Implements business logic (e.g., what happens after a QR code is scanned)
- **When helping Hassan**: Focus on React/TypeScript patterns, API integration, state management

### Ewaldo (Platform Engineer)
- Controls 100% of `android/` folder and Android Studio
- Installs Capacitor plugins (`npm install @capacitor/...`)
- Configures `AndroidManifest.xml` (permissions, deep links, etc.)
- Manages `capacitor.config.ts`
- Generates final signed `.apk` with `.jks` key
- **When helping Ewaldo**: Focus on native Android config, plugin setup, build process

**Rule**: Always separate your answer into "**Your Part (Ewaldo)**" and "**Hassan's Part**" when responding to platform-related questions.

## Project Overview
**Gestão de Inventário** is a React 19 + TypeScript inventory management system deployed as both a web app (CRA) and Android mobile app (Capacitor v7+). It communicates with a local Spring Boot backend via OAuth2 Bearer token authentication over **HTTP** (not HTTPS).

### Architecture: Role-Based Access Control (RBAC)
- **Auth Flow**: OAuth2 password grant → JWT tokens stored in localStorage → Bearer auth for API calls
- **Roles**: PERFIL_ADMIN, PERFIL_ANALISTA_INVENTARIO, PERFIL_USUARIO
- **Route Protection**: `PrivateRoute` wraps pages, checks `isAuthenticated()` + `hasAnyRoles()`
- **Contexts**: `AuthContext` (auth state sync), `UserContext` (user data)

## Key Directories & Patterns

### `src/utils/` - Core Logic
- **`requests.ts`**: HTTP client with `requestBackend()` (adds Bearer token) and `requestBackendLogin()` (OAuth)
- **`auth.ts`**: JWT utilities (`getTokenData()`, `isAuthenticated()`, `hasAnyRoles()`)
- **`storage.ts`**: localStorage helpers for auth/user data (separate functions per domain)
- **`functions.ts`**: Reusable async data fetchers (e.g., `fetchAllAreas()`) and formatters (`formatarData()`, `formatarPerfil()`)
- **`contexts/`**: Two contexts only — avoid adding more
- **`providers/`**: `AuthProvider` syncs auth state across browser tabs via `storage` event listener

### `src/components/` - Reusable UI
- **Card Components**: `CardAtivoQtd`, `CardNotificacao`, `CardAtivoRecente` (similar structure)
- **Pattern**: Props interface, export from `index.tsx`, co-located `styles.css`
- **Skeleton Loaders**: Named pattern `XYZSkeletonLoader/` (e.g., `CAQSkeletonLoader`) in subdirectories

### `src/pages/` - Feature Modules
- Four main pages: `Home`, `Auth`, `Ativo`, `Admin`
- Each page manages its own `useEffect` hooks and local state
- Use `requestBackend()` with `AxiosRequestConfig` object for data fetching
- Error handling via `toast.error()` (react-toastify)

### `src/types/` - Type Definitions
- **One file per domain**: `ativo.ts`, `area.ts`, `fornecedor.ts`, `usuario_responsavel.ts`, etc.
- Named pattern: `TypeNameType` (e.g., `AtivoType`, `NotificacaoType`)
- Types compose each other (e.g., `AtivoType` includes `AreaType`, `LocalizacaoType`)

## Development & Build

### Commands
```bash
npm start      # Craco dev server → http://localhost:3000
npm test       # Jest + react-testing-library
npm run build  # Optimized production bundle
```

### Path Aliasing
Use `@/` prefix (configured in `craco.config.js` + `tsconfig.json`):
```tsx
import { AtivoType } from "@/types/ativo";
import { requestBackend } from "@/utils/requests";
```

### Multi-Environment Configuration
- **Base URLs** in `src/utils/requests.ts`: Switch commented blocks (localhost/homol/prod)
- **Env Vars**: `REACT_APP_BACKEND_URL`, `REACT_APP_CLIENT_ID`, `REACT_APP_CLIENT_SECRET`
- **Build Target**: `/gestao-inventario` route prefix (see `Routes.tsx`)

## Critical Patterns & Conventions

### API Integration Pattern
```tsx
// In pages/components:
const [loading, setLoading] = useState(false);
const requestParams: AxiosRequestConfig = {
  url: "/endpoint",
  method: "GET",      // or POST/PUT/DELETE
  withCredentials: true  // CRITICAL: enables Bearer token
};

requestBackend(requestParams)
  .then(res => { /* use res.data */ })
  .catch(err => { toast.error("User message"); })
  .finally(() => { setLoading(false); });
```

### Async Data Fetchers
Extract reusable API calls to `src/utils/functions.ts`:
```ts
export async function fetchAllNotificacoes(): Promise<NotificacaoType[]> {
  const requestParams: AxiosRequestConfig = { /* ... */ };
  try {
    const res = await requestBackend(requestParams);
    return res.data as NotificacaoType[];
  } catch (err) {
    throw new Error("User-friendly message");
  }
}
```

### Date Formatting
Use `formatarData(dateString)` (converts "yyyy-mm-dd" → "dd/mm/yyyy", handles ISO 8601 with T)

### Role-Based Rendering
```tsx
const { authContextData } = useContext(AuthContext);
// Check: authContextData.authenticated, authContextData.tokenData?.authorities
// Or use PrivateRoute wrapper for pages
```

## Capacitor & Mobile Build (Ewaldo's Domain)

### Current Configuration
- **App ID**: `br.com.ctcea.inventario`
- **Plugins Installed**: Camera, Geolocation, MLKit barcode scanning
- **Backend Protocol**: HTTP (local network) — NOT HTTPS

### ⚠️ HTTP Backend Implications (Critical for Android)

**Your Part (Ewaldo - Native Config):**
1. **`AndroidManifest.xml`** must include:
   ```xml
   <domain-config cleartextTrafficPermitted="true">
       <domain includeSubdomains="true">172.20.71.103</domain>
       <!-- Add other backend IPs here -->
   </domain-config>
   ```
   OR (less secure, allow all HTTP):
   ```xml
   android:usesCleartextTraffic="true"
   ```

2. **`capacitor.config.ts`** already configured correctly:
   ```typescript
   server: {
       androidScheme: 'http'  // Prevents Mixed Content errors
   }
   ```

3. **Build Workflow**:
   - Hassan runs `npm run build` (creates optimized bundle in `build/`)
   - You run `npx cap sync android` (syncs to Android project)
   - You open Android Studio and generate signed APK with `.jks` key

**Hassan's Part (React - API Calls):**
- Base URL in `src/utils/requests.ts` switches between: `http://172.20.71.103:9005/gestaoinventario/api` (localhost), homol, prod
- All `requestBackend()` calls automatically add Bearer token
- Use `withCredentials: true` in all API requests

### Plugin Installation & Sync Pattern
```bash
# Step 1: Hassan or Ewaldo installs from project root
npm install @capacitor/plugin-name

# Step 2: Ewaldo syncs to Android
npx cap sync android

# Step 3: Ewaldo opens Android Studio and manages gradle dependencies if needed
```

### Preferred Plugins (Ewaldo)
- Official: `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/android`
- Community (vetted): `@capacitor-mlkit/barcode-scanning` for QR codes
- Avoid: Abandoned or low-quality plugins

## Android Permissions (Ewaldo's Responsibility)

### Required Permissions Template
Add these to `android/app/src/main/AndroidManifest.xml` based on features:

```xml
<!-- Network access -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Camera (for QR code scanning) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Geolocation (if tracking assets) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- File storage (for uploads/downloads) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Android 12+ (READ_MEDIA_IMAGES for camera roll access) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

### Runtime Permissions (Android 6+)
- Capacitor plugins **automatically request** permissions at runtime
- Users grant in settings if plugin calls them
- **Exception**: If app refuses permission → plugin returns null/error
- **Hassan's job**: Handle permission denied errors gracefully in React

### Example Permission Flow
1. Ewaldo: Adds `<uses-permission>` to manifest
2. Hassan: Calls `BarcodeScanner.scan()` in React
3. Android: Shows permission dialog to user
4. If granted: Plugin works; if denied: Plugin throws error
5. Hassan: Catches error and shows `toast.error("Câmera não disponível")`

---

## Certificate & APK Signing (Ewaldo's Responsibility)

### Generate Keystore (.jks)
```bash
# Run once to create your certificate (keep this file safe!)
keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 36500 -alias gestao-inventario

# It will ask for:
# - Key store password: [YOUR_PASSWORD]
# - Alias password: [SAME_PASSWORD]
# - Name (CN): Your Name
# - Organization (OU): Your Company
# - Location (L): City
# - State (ST): State
# - Country (C): BR
```

**IMPORTANT**: Store `release.jks` securely. You need it every time you build signed APKs.

### Gradle Configuration for Signing
Add to `android/app/build.gradle` (inside `android {}` block):

```gradle
signingConfigs {
    release {
        storeFile file("../release.jks")
        storePassword System.getenv("KEY_STORE_PASSWORD")
        keyAlias "gestao-inventario"
        keyPassword System.getenv("KEY_PASSWORD")
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Build Signed APK (Android Studio)
1. Open **Build → Generate Signed Bundle / APK**
2. Select **APK** (not Bundle)
3. Select `release.jks` file
4. Enter passwords (from env vars or keystore)
5. Select **release** build variant
6. Android Studio generates: `android/app/release/app-release.apk`

### Environment Variables (for CI/CD)
```bash
export KEY_STORE_PASSWORD="your_keystore_password"
export KEY_PASSWORD="your_key_password"
```

---

## Build & Deployment Workflow (Ewaldo)

### Complete Build Process
```bash
# Step 1: Hassan develops and tests locally
npm start

# Step 2: Hassan builds optimized React bundle
npm run build

# Step 3: Ewaldo syncs to Android
npx cap sync android

# Step 4: Ewaldo opens Android Studio
open -a "Android Studio" android/

# Step 5: In Android Studio:
# - Verify gradle sync completed
# - Select build variant: "release"
# - Build → Generate Signed Bundle / APK
# - Final APK: android/app/release/app-release.apk

# Step 6: Distribute APK to internal users
# (via email, file share, or internal app store)
```

### Gradle Build Commands (Terminal Alternative)
```bash
cd android

# Debug build (quick testing)
./gradlew assembleDebug

# Release build (requires signing config)
./gradlew assembleRelease
```

---

## Build Troubleshooting (Ewaldo's Checklist)

### "Gradle sync failed"
- [ ] Android SDK version matches `android/variables.gradle`
- [ ] Java/JDK version is 11+ (set via `JAVA_HOME`)
- [ ] Run `./gradlew clean` in `android/` folder
- [ ] Invalidate Cache in Android Studio: **File → Invalidate Caches**
- [ ] Delete `android/.gradle` folder and retry

### "Build fails with 'Could not find symbol'"
- [ ] Run `npx cap sync android` (missing dependency mapping)
- [ ] Run `./gradlew build --scan` for detailed error logs
- [ ] Check plugin's `build.gradle` includes dependencies correctly
- [ ] Verify `android/app/build.gradle` extends all necessary plugins

### "Cannot find keystore file (release.jks)"
- [ ] Verify `release.jks` exists in `android/` folder
- [ ] Check path in `android/app/build.gradle` is correct: `file("../release.jks")`
- [ ] Environment variables set: `KEY_STORE_PASSWORD`, `KEY_PASSWORD`
- [ ] Run: `keytool -list -v -keystore release.jks` to verify keystore

### "APK installation fails on device"
- [ ] Uninstall previous version: `adb uninstall br.com.ctcea.inventario`
- [ ] Verify APK signed with same certificate (if updating)
- [ ] Check Android version on device matches `minSdkVersion` in `android/app/build.gradle`
- [ ] Ensure `android:usesCleartextTraffic` is set for HTTP backend
- [ ] Test with: `adb install android/app/release/app-release.apk`

### "App crashes when opening camera or geolocation"
- [ ] Verify permissions in `AndroidManifest.xml`
- [ ] Test permissions manually: **Settings → Apps → Gestão Inventário → Permissions**
- [ ] Check `capacitor.config.ts` has correct `webDir` pointing to React build
- [ ] Run `npx cap sync android` after plugin installation
- [ ] Check Logcat in Android Studio for native errors

### "HTTP requests fail (Mixed Content error)"
- [ ] Verify `android:usesCleartextTraffic="true"` in manifest (or `domain-config` with specific IPs)
- [ ] Verify `capacitor.config.ts` has `server: { androidScheme: 'http' }`
- [ ] Verify backend IP/port matches in `src/utils/requests.ts`
- [ ] Test network connectivity: `ping 172.20.71.103`
- [ ] Check Android firewall settings don't block port 9005

### "App won't run after Hassan updates React code"
1. Hassan: Runs `npm run build`
2. Ewaldo: Runs `npx cap sync android`
3. Ewaldo: Opens Android Studio → **Build → Clean Project**
4. Ewaldo: **Build → Rebuild Project**
5. If still failing: Check `build/` folder exists and has files

---

## Files NOT to Modify Without Coordination
- `android/` (except `AndroidManifest.xml` for permissions)
- `craco.config.js` (path alias setup)
- `capacitor.config.ts` (coordinate with Ewaldo)

## New Feature Checklist
1. Add type in `src/types/` (new file if new domain)
2. Add API fetcher in `src/utils/functions.ts` if data-heavy
3. Create component/page in appropriate directory
4. Use `@/` imports + `AxiosRequestConfig` pattern
5. Wrap route in `PrivateRoute` with required roles
6. Test with environment switched (localhost → prod URLs in `requests.ts`)

---

## How to Answer Common Questions (For AI Agents)

### Example: "How to implement QR code reading?"

**Your Part (Ewaldo - Native):**
1. Install: `npm install @capacitor-mlkit/barcode-scanning`
2. Run: `npx cap sync android`
3. Add to `AndroidManifest.xml`: `<uses-permission android:name="android.permission.CAMERA" />`
4. Add to Android app-level `build.gradle`: MLKit dependencies (if needed)
5. Verify in Android Studio: Camera permission in app settings

**Hassan's Part (React):**
1. Import barcode scanner in component
2. Call scanner function on button click
3. Handle result and parse QR code data
4. Make API call with scanned data using `requestBackend()`
5. Show result in UI or redirect based on data

### Example: "Backend is not responding with HTTP"

**Diagnosis Checklist:**
- Ewaldo: Verify `android:usesCleartextTraffic` or `domain-config` in manifest
- Ewaldo: Confirm backend IP matches in `capacitor.config.ts`
- Hassan: Check network request in React DevTools, verify correct Bearer token
- Hassan: Ensure `withCredentials: true` in Axios config
- Shared: Test on same network; firewall may block 9005/9006/9007 ports

### Example: "App crashes on startup"

**Ewaldo's Checklist:**
- Verify `AndroidManifest.xml` has required permissions
- Check gradle sync completed without errors
- Verify `capacitor.config.ts` webDir points to correct build folder

**Hassan's Checklist:**
- Check browser console (web version) for React errors
- Verify JWT token is valid and stored in localStorage
- Check `AuthProvider` initialization in App.tsx
- Verify API endpoint URLs are correct

---

## Advanced Topics (For Future Features)

### Deep Links (Ewaldo + Hassan)
If app needs to open from external URLs (e.g., email links to specific assets):

**Ewaldo's Part:**
```xml
<!-- In AndroidManifest.xml, add to MainActivity -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="http" android:host="172.20.71.103" android:pathPrefix="/gestao-inventario" />
</intent-filter>
```

**Hassan's Part:**
- Use `useEffect` to check Capacitor's `App.addListener('appUrlOpen', ...)` 
- Parse deep link URL and navigate to correct page using React Router

### Push Notifications (Future Feature)
- Plugin: `@capacitor/push-notifications`
- Ewaldo: Handles Firebase setup and Android manifest
- Hassan: Handles notification UI and routing when user taps notification

### File Uploads/Downloads (Already in Use)
- `UploadArquivos` component exists in `src/components/`
- Uses `@capacitor/filesystem` for Android file access
- Verify permissions: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` in manifest

---

## Debugging Tools (Ewaldo)

### Android Logcat (Real-time App Logs)
```bash
# In Android Studio:
# 1. Open: View → Tool Windows → Logcat
# 2. Filter by app: Select "br.com.ctcea.inventario" in dropdown
# 3. Search for crashes: Filter for "FATAL EXCEPTION"

# Via Terminal:
adb logcat | grep "gestao\|FATAL"
```

### Common Log Patterns
- **"E/Capacitor"**: Capacitor plugin error
- **"E/AndroidRuntime"**: Native Android crash
- **"W/System"**: Android warnings
- **"I/chromium"**: WebView (React) logs

### Remote Debugging (React on Android)
```bash
# Hassan: In Chrome on desktop
# 1. Open chrome://inspect
# 2. Enable "Discover USB devices"
# 3. Connect phone via USB with "USB Debugging" enabled
# 4. Select app → "Inspect"
# 5. Now can use Chrome DevTools for React debugging
```

### ADB Commands (Common)
```bash
# Connect to device
adb devices

# Install APK
adb install path/to/app-release.apk

# Uninstall app
adb uninstall br.com.ctcea.inventario

# Push file to device
adb push localfile /sdcard/Download/

# Pull file from device
adb pull /sdcard/Download/file localfile

# View device info
adb shell getprop ro.build.version.release  # Android version
adb shell getprop ro.product.device         # Device model
```

---

## Quick Reference (Ewaldo's Checklists)

### Pre-Release Checklist
- [ ] `npm run build` runs successfully (Hassan)
- [ ] `npx cap sync android` runs without errors
- [ ] Android Studio gradle sync successful
- [ ] No errors in Logcat before building APK
- [ ] `release.jks` keystore file exists and passwords set
- [ ] Target Android version compatible with devices in use
- [ ] `android:usesCleartextTraffic="true"` set for HTTP backend
- [ ] All required permissions in `AndroidManifest.xml`
- [ ] Test on actual device (not just emulator)
- [ ] Backend URLs in `src/utils/requests.ts` match environment

### First-Time Setup
- [ ] Java/JDK 11+ installed and `JAVA_HOME` set
- [ ] Android SDK installed (API 24+)
- [ ] Android Studio installed and configured
- [ ] Run `npm install` in project root
- [ ] Run `npx cap add android` (if android/ doesn't exist)
- [ ] Generate `release.jks` with keytool
- [ ] Configure `android/app/build.gradle` with signing config
- [ ] Run `npx cap sync android`

### Weekly Development Workflow
1. Hassan makes React changes
2. Hassan runs `npm start` and tests locally
3. When ready: Hassan runs `npm run build`
4. Ewaldo runs: `npx cap sync android`
5. Ewaldo builds APK in Android Studio
6. Ewaldo tests on device
7. If issues: Use Logcat to debug, sync again, rebuild

---

## Contact & Support

**For React/TypeScript Questions:** Ask Hassan or check `src/` patterns  
**For Android/Build Questions:** Ask Ewaldo (this file covers most scenarios)  
**For Backend Integration Issues:** Check `src/utils/requests.ts` (Hassan) + network setup (Ewaldo)
