import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Safescreen from '../components/Safescreen'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Safescreen>
      <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name="index" options={{title:'System'}}/>
      </Stack>
      </Safescreen>
      <StatusBar style="dark"/>
  </SafeAreaProvider>
  )
}
