import { Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

const Signin = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-6xl text-gray-500 font-extrabold mb-8">SignIn</Text>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="bg-blue-500 py-2 px-12 rounded-lg"
      >
        <Text className="text-white text-2xl font-semibold">Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Signin;