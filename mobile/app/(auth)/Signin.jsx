import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import {router} from 'expo-router'

const Signin = () => {
  const [formData, setFormData] = useState({
    userid: '',
    password: '',
  });

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleBack = () => {
    router.replace('/')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center bg-gray-100">
        <View className="w-full max-w-xl bg-white p-8 rounded-lg shadow-xl">
          <Text className="text-4xl text-gray-700 font-semibold text-center mb-8">Sign in</Text>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 text-2xl">ID</Text>
            <TextInput
              className="w-full h-18 border border-gray-300 rounded-lg px-3 text-2xl"
              placeholder="Enter your ID"
              value={formData.userid}
              onChangeText={(text) => handleChange('userid', text)}
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 mb-2 text-2xl">Password</Text>
            <TextInput
              className="w-full h-18 border border-gray-300 rounded-lg px-3 text-2xl"
              placeholder="Enter your password"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
            />
          </View>

          <TouchableOpacity
            className="bg-[#00787a] py-3 px-6 rounded-lg items-center"
          >
            <Text className="text-white text-2xl font-semibold">Sign in</Text>
          </TouchableOpacity>

          <View className='mt-4'>
            <TouchableOpacity
              className="bg-[#00787a] py-3 px-6 rounded-lg items-center"
              onPress={handleBack}
            >
              <Text className="text-white text-2xl font-semibold">Back</Text>
            </TouchableOpacity>
          </View>

          
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Signin;