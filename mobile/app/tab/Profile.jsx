import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import useUserstore from '../../store'
import PrivateRoute from '../../components/PrivateRoute'

const Profile = ()  => {

  const {currentUser, signOutSuccess} = useUserstore()

  const handleSignout = async () => {
    try {
      const res = await fetch('http://192.168.212.66:3000/api/user/signout',{
        method: 'POST'
      })
      const data = await res.json()
      if(res.ok){
        signOutSuccess(data)
      }else{
        console.log(data.message)
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  return (
    <View className='flex-1 items-center justify-center'>
      <View className='w-full max-w-lg bg-white shadown-lg p-8 rounded-lg'>
        <Text className='text-2xl text-gray-500 font-semibold text-center'>Profile</Text>

        <View className='mt-4'>
          <Text className='text-xl border border-gray-300 rounded-lg p-3'>Username : {currentUser.username}</Text>
        </View>

        <View className='mt-4'>
          <Text className='text-xl border border-gray-300 rounded-lg p-3'>ID : {currentUser.userid}</Text>
        </View>

        <TouchableOpacity className="px-8 py-3 bg-[#006b7e] rounded-full mt-4" onPress={handleSignout}>
          <Text className='text-2xl font-semibold text-white text-center'>Sign out</Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

export default PrivateRoute(Profile);