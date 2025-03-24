import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
    <Stack.Screen name="Home" options={{headerShown:false}}/>
    <Stack.Screen name="(auth)/Signin" options={{headerTransparent:true, headerTitle:''}}/>
    <Stack.Screen name="(tab)" options={{headerShown:false}}/>
    <Stack.Screen name="add-order/Order" options={{headerTitle:'Add New Order'}}/>
    </Stack>
}
