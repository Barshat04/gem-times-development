# gem_times

React Native mobile app using Expo.

## Setup Requirements

You need these installed on your computer:

- Node.js - Download from https://nodejs.org/
- npm - Comes with Node.js

## Installation Steps

1. Clone this repo:

```bash
git clone https://github.com/Barshat04/gem-times-development
cd gem-times-development
```

## Easy way to run on your phone:

---

# Running Expo Dev Builds for Existing Project

This guide will walk you through the necessary steps to run **Expo Dev Builds** for your existing Expo project. Follow the steps carefully to ensure everything works smoothly.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Expo CLI](#step-1-install-expo-cli)
3. [Step 2: Install Expo Dev Client](#step-2-install-expo-dev-client)
4. [Step 3: Configure the App for Expo Dev Builds](#step-3-configure-the-app-for-expo-dev-builds)
5. [Step 4: Build the App](#step-4-build-the-app)
6. [Step 5: Run the App Locally](#step-5-run-the-app-locally)
7. [Step 6: Debug and Develop with the Dev Client](#step-6-debug-and-develop-with-the-dev-client)
8. [Step 7: Troubleshooting](#step-7-troubleshooting)

---

## Prerequisites

Before you start, ensure you have the following installed:

1. **Node.js** – You should have Node.js installed. If not, download it from [here](https://nodejs.org/).

   - This project will use the API hosted in futureaccess's domain and hence will automatically fetch data from MySQL DB.

2. **Expo CLI** – If you haven’t installed Expo CLI, you can do so with the following command:

   ```bash
   npm install -g expo-cli
   ```

3. **Expo Account** – You’ll need an Expo account to create builds. If you don’t have one, sign up [here](https://expo.dev/signup).

---

## Step 1: Install Expo CLI

If you don’t have Expo CLI installed globally, run:

```bash
npm install -g expo-cli
```

Verify the installation by running:

```bash
expo --version
```

---

## Step 2: Install Expo Dev Client

To use custom native code in your project, you need to install the **Expo Dev Client**.

1. Install the necessary dependencies in your project by running:

   ```bash
   expo install expo-dev-client
   ```

2. Ensure your `app.json` or `app.config.js` is configured for Expo Dev Client:

   ```json
   {
     "expo": {
       "devClient": true
     }
   }
   ```

---

## Step 3: Configure the App for Expo Dev Builds

1. Open the project directory in your terminal.

2. Ensure you have an **Expo project** setup with necessary dependencies. If you’re starting from scratch, you can initialize a new project with:

   ```bash
   expo init my-project
   ```

3. Add **Expo Dev Client** to the dependencies if it’s not already installed:

   ```bash
   npx expo install expo-dev-client
   ```

---

## Step 4: Build the App

1. **Login to Expo**:

   If you aren’t logged in, use the following command to authenticate:

   ```bash
   npx expo login
   ```

2. **Create a Development Build**:
   To build the app for your platform (iOS/Android), run the following command:

   ```bash
   npx expo run:ios --dev-client
   ```

   or

   ```bash
   npx expo run:android --dev-client
   ```

   This command will create a dev build for the iOS or Android platform, depending on your target.

   If you are having problems connecting your phone to the development environment use this tunnel command to bypass firewalls:

   ```bash
   npx expo start --dev-client --tunnel
   ```

---

## Step 5: Run the App Locally

1. After the build finishes, **download** the generated build (the `.apk` for Android or `.ipa` for iOS).

2. Install the build on your physical device or simulator/emulator.

   - For **Android**, you can install the APK directly or use Android Studio/adb to install it.
   - For **iOS**, you can use Xcode or a service like TestFlight.

3. Launch the app using the Expo Go app (if using an iOS build). If you’re using Android, you can scan the QR code from the development server for quick access.

4. After opening your app, an expo UI will be presented to you, you can login with your expo credentials and then choose the development server link shown in the screen. The link will match the on in your PC's terminal below the QR code. This shoulld run the app successfully.

Connection issues:

- Make sure your phone and computer are on the same WiFi network
- Try using a tunnel connection with `expo start --tunnel`

## More Info

- Expo Docs: https://docs.expo.dev/
- React Native Docs: https://reactnative.dev/
