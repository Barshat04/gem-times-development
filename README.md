# gem_times

React Native mobile app using Expo.

## Setup Requirements

You need these installed on your computer:
- Node.js - Download from https://nodejs.org/ 
- npm - Comes with Node.js

## Installation Steps

1. Clone this repo:
```bash
git clone https://github.com/u1126097/gem_times/tree/main
cd GEM_Times
```

2. Install dependencies:
```bash
npm install
```

## Running the App

Start the development server:
```bash
npm start
```

This will start a local development server and show a QR code in your terminal.

### Easy way to run on your phone:

1. Install the Expo Go app on your phone:
   - iOS: [App Store](https://apps.apple.com/us/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent&hl=en_AU)

2. Scan the QR code:
   - iOS: Use your camera app
   - Android: Use the Expo Go app to scan

### Alternative ways to run:

For iOS simulator (Mac only, requires Xcode):
```bash
npm run ios
```

For Android emulator (requires Android Studio):
```bash
npm run android
```

For web browser:
```bash
npm run web
```

## Troubleshooting

App won't start or has weird errors:
```bash
expo r -c  # clears the cache
```

Connection issues:
- Make sure your phone and computer are on the same WiFi network
- Try using a tunnel connection with `expo start --tunnel`

## More Info

- Expo Docs: https://docs.expo.dev/
- React Native Docs: https://reactnative.dev/
