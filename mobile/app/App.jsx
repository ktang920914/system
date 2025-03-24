import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

export default function app() {
  return (
    <View>
      <Text>app</Text>
      <Link href="/auth/Signin">Go to Signin</Link>
    </View>
  )
}