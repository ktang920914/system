import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import useUserstore from '../../store'
import { router } from 'expo-router'

export default function Profile() {

    const {currentUser, signOutSuccess} = useUserstore()

    const handleSignOut = async () => {
        try {
            const res = await fetch('http://192.168.212.66:3000/api/user/signout',{
                method:'POST'
            })
            const data = await res.json()
            if(res.ok){
                signOutSuccess(data)
                router.replace('/')
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
          <Text className='text-2xl text-gray-500 font-semibold text-center'>PROFILE</Text>

            <View className='mt-4'>
                <Text className='text-xl'>Username : </Text>
                <TextInput className='w-full h-18 border-gray-300 border rounded-lg px-3 text-xl' 
                value={currentUser.username}/>
            </View>

            <View className='mt-4'>
                <Text className='text-xl'>ID : </Text>
                <TextInput className='w-full h-18 border-gray-300 border rounded-lg px-3 text-xl' 
                value={currentUser.userid}/>
            </View>

            <TouchableOpacity className="px-8 py-3 bg-[#006b7e] rounded-full mt-4" onPress={handleSignOut}>
                <Text className='text-2xl font-semibold text-white text-center'>Sign out</Text>
            </TouchableOpacity>
        </View>
    </View>
  )
}