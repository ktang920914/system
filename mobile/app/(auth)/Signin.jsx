import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'

const Signin = () => {

    const [formData, setFormData] = useState({})

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value})
    }

  return (
    <View className='flex-1 items-center justify-center'>
      <Text className='text-6xl text-gray-500 font-extrabold'>SignIn</Text>
    </View>
  )
}

export default Signin

const styles = StyleSheet.create({})