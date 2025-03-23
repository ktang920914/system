import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Link, router } from 'expo-router'
import useUserstore from '../../store'

const Signin = () => {

    const {currentUser, signInSuccess} = useUserstore()

    const [formData, setFormData] = useState({
        userid: '',
        password: ''
    })

    const handleChange = (name,value) => {
        setFormData({...formData, [name]: value})
    }

    const handleSignin = async () => {
        try {
            const res = await fetch('http://192.168.212.66:3000/api/auth/signin',{
                method: 'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(formData)
            })
            const data = await res.json()
            if(res.ok){
                signInSuccess(data)
                router.replace('/Table')
            }else{
                console.log(data.message)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleBack = () => {
        router.replace('/')
    }

  return (
    <View className='flex-1 items-center justify-center'>
    <View className='w-full max-w-lg bg-white shadown-lg p-8 rounded-lg'>
      <Text className='text-2xl text-gray-500 font-semibold text-center'>Sign in</Text>

        <View className='mt-4'>
            <Text className='text-xl'>ID : </Text>
            <TextInput className='w-full h-18 border-gray-300 border rounded-lg px-3 text-xl'
            placeholder='Enter your ID'
            onChangeText={(text) => handleChange('userid', text)}
            value={formData.userid}/>
        </View>

        <View className='mt-4 mb-4'>
            <Text className='text-xl'>Password : </Text>
            <TextInput className='w-full h-18 border-gray-300 border rounded-lg px-3 text-xl'
            placeholder='Enter your password'
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry
            value={formData.password}/>
        </View>

        <TouchableOpacity className="px-8 py-3 bg-[#006b7e] rounded-full mt-4"  onPress={handleSignin}>
                <Text className='text-2xl font-semibold text-white text-center'>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity className="px-8 py-3 bg-[#006b7e] rounded-full mt-4" onPress={handleBack}>
                <Text className='text-2xl font-semibold text-white text-center'>Back</Text>
        </TouchableOpacity>

    </View>
    </View>
  )
}

export default Signin

const styles = StyleSheet.create({})