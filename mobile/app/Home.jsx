import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'

export default function Home() {

    const router = useRouter()

  return (
    <View className='flex-1 items-center justify-center'>
      <Text className='text-gray-500 text-4xl font-semibold'>WeLcOmE</Text>
      <Text className='text-gray-500 text-4xl font-semibold mt-2'>To</Text>
      <Text className='text-gray-500 text-4xl font-semibold mt-2 mb-2'>SysTeM</Text>

      <TouchableOpacity className='bg-[#006b7e] px-6 py-3 rounded-full mt-4'
        onPress={() => router.push('/(auth)/Signin')}>
        <Text className='text-white text-2xl font-semibold'>Get Started</Text>
      </TouchableOpacity>
    </View>
  )
}