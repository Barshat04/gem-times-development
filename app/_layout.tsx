import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NativeBaseProvider } from "native-base";

import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ContextProviders from "@/components/ContextProviders";
import { operatorsStore$, questionsStore$, siteDetailsStore$ } from "@/observables";

export const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    // getting the values so that data is initialized in the beginning
    siteDetailsStore$.siteDetails.get();
    operatorsStore$.operators.get();
    questionsStore$.questions.get();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

// TT change:
// Use Native Base Ui wrapper
function RootLayoutNav() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContextProviders>
        <NativeBaseProvider>
          <StatusBar style="dark" />
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaView style={{ flex: 1 }}>
                <Stack
                  initialRouteName="login"
                  screenOptions={{ headerShown: false }}
                >
                  <Stack.Screen name="login" />
                  <Stack.Screen name="day-start" />
                  <Stack.Screen name="mainscreen" />
                  <Stack.Screen name="time-entry" />
                  <Stack.Screen
                    name="modal"
                    options={{ headerShown: false, presentation: "modal" }}
                  />
                </Stack>
              </SafeAreaView>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </NativeBaseProvider>
      </ContextProviders>
    </QueryClientProvider>
  );
}