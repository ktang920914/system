import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

export default function main() {
  return (
        <View className='flex-1 items-center justify-center'>
        <Text className="text-gray-500 text-6xl font-extrabold">Welcome</Text>
        <Text className="text-gray-500 text-6xl font-extrabold mt-2">To</Text>
        <Text className="text-gray-500 text-6xl font-extrabold mt-2">System</Text>

            <View>
              <TouchableOpacity>
              <Link  className='mt-8 bg-slate-500 py-4 px-12 rounded-full text-white font-bold text-3xl' href='/(auth)/Signin'>
                <Text className="text-white text-2xl font-semibold ">JOIN</Text>
                </Link>
              </TouchableOpacity>
              </View>
            

        
        </View>
    
  )
}