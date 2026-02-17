# Native Platform Privacy Configuration

## iOS (Info.plist)
After running `npx cap add ios`, add these entries to `ios/App/App/Info.plist`:

```xml
<!-- Location permissions -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Remind Me needs your location to trigger reminders when you arrive at saved places like Home or Work.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Remind Me needs background location access to send you reminders when you arrive at your saved places, even when the app is closed.</string>

<!-- Notification permissions -->
<key>NSUserNotificationsUsageDescription</key>
<string>Remind Me sends you reminders for your saved sentences at scheduled times or when you arrive at specific locations.</string>
```

## Android (AndroidManifest.xml)
After running `npx cap add android`, add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Inside <manifest> tag -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## Notes
- The app requests location permission at runtime when the user first taps "Add Location" or "Use Current Location"
- Notifications permission is requested on first login
- Background location (Android 10+) requires a separate permission dialog — the user must select "Allow all the time"
- For iOS, location permissions are requested via the native dialog automatically by @capacitor/geolocation
