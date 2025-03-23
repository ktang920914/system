import { View, Text } from 'react-native'
import React from 'react'
import useUserstore from '../../store'

export default function Profile() {

    const {currentUser} = useUserstore()

  return (
    <View className='flex flex-col items-center gap-2'>
        <Text className='text-2xl text-gray-500 font-semibold'>Username : {currentUser.username}</Text>
        <Text className='text-2xl text-gray-500 font-semibold'>ID : {currentUser.userid}</Text>
    </View>
  )
}