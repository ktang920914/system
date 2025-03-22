import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name="index" options={{title:'System'}}/>
      </Stack>
      <StatusBar style="dark"/>
  </SafeAreaProvider>
  )
}
