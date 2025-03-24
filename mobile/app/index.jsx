import { Text, View } from "react-native";
import './global.css'
import { Redirect } from "expo-router";

export default function Index() {
  return (
    <View>
      <Redirect href={'/Home'}/>
    </View>
  );
}
