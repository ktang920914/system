import { Label, TextInput } from 'flowbite-react'
import React from 'react'
import { useSelector } from 'react-redux'

const Profile = () => {

    const {currentUser} = useSelector(state => state.user)

  return (
    <div className='w-full max-w-lg p-3 mx-auto mt-4'>
        <h1 className='text-gray-500 text-3xl text-center font-semibold'>Profile</h1>

        <div className='mt-4'>
            <Label value='Username'/>
            <TextInput type='text' defaultValue={currentUser.username} readOnly/>
        </div>
        <div className='mt-4'>
            <Label value='ID'/>
            <TextInput type='text' defaultValue={currentUser.userid} readOnly/>
        </div>
    </div>
  )
}

export default Profile