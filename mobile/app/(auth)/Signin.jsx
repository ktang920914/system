import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

const Signin = () => {
  const [formData, setFormData] = useState({
    userid: '',
    password: '',
  });

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center bg-gray-100">
        <View className="w-full max-w-xl bg-white p-8 rounded-lg shadow-md">
          <Text className="text-2xl text-gray-700 font-semibold text-center mb-8">Sign in</Text>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">ID</Text>
            <TextInput
              className="w-full h-12 border border-gray-300 rounded-lg px-3"
              placeholder="Enter your ID"
              value={formData.userid}
              onChangeText={(text) => handleChange('userid', text)}
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 mb-2">Password</Text>
            <TextInput
              className="w-full h-12 border border-gray-300 rounded-lg px-3"
              placeholder="Enter your password"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
            />
          </View>

          <TouchableOpacity
            className="bg-blue-500 py-3 px-6 rounded-lg items-center"
          >
            <Text className="text-white text-lg font-semibold">Sign in</Text>
          </TouchableOpacity>

          <View className="mt-4">
            <Text className="text-gray-700 text-sm text-center">
              Don't have an account?{' '}
              <Text className="text-blue-500 text-sm underline">
                Sign up
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Signin;