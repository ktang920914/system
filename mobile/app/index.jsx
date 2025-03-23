import { Text, TouchableOpacity, View } from "react-native";
import './global.css'
import { Link } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-gray-500 font-semibold text-4xl">WeLcOmE</Text>
      <Text className="text-gray-500 font-semibold text-4xl mt-2">To</Text>
      <Text className="text-gray-500 font-semibold text-4xl mt-2">SysTeM</Text>

      
        <TouchableOpacity>
        <Link className="px-14 py-3 bg-[#006b7e] rounded-full mt-4" href='(auth)/Signin'>
          <Text className='text-2xl font-semibold text-white'>JOIN</Text>
          </Link>
        </TouchableOpacity>
      
    </View>
  );
}
