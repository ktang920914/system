import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const index = () => {
  return (
    <SafeAreaProvider>
      <View className='flex-1 items-center justify-center'>
        <Text className='text-6xl text-red-500'>index</Text>
        <Link href='/signup'>Signup</Link>
        <Link href='/signin'>Signin</Link>
      </View>
      </SafeAreaProvider>
  )
}

export default index

const styles = StyleSheet.create({})