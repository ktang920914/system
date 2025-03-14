import { Alert, Button, Label, TextInput } from 'flowbite-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

const ChangePassword = () => {

    const {currentUser} = useSelector(state => state.user)
    const [formData, setFormData] = useState({})
    const [errorMessage, setErrorMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)


    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/user/update/${currentUser._id}`,{
                method: 'PUT',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setSuccessMessage(null)
            }
            if(res.ok){
                setSuccessMessage(data.message)
                setErrorMessage(null)
            }
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

  return (
    <div className='w-full max-w-lg p-3 mx-auto mt-4'>
        <h1 className='text-gray-500 text-3xl text-center font-semibold'>Change Password</h1>

        {
            errorMessage && (
                <Alert color='failure' className='my-2'>
                    {errorMessage}
                </Alert>
            )
        }

        {
            successMessage && (
                <Alert color='success' className='my-2'>
                    {successMessage}
                </Alert>
            )
        }

        <form onSubmit={handleSubmit}>
            <div className='mt-4'>
                <Label value='Old Password'/>
                <TextInput type='password' id='oldpassword' placeholder='Enter your old password' 
                onChange={handleChange} required/>
            </div>
            <div className='mt-4'>
                <Label value='New Password'/>
                <TextInput type='password' id='newpassword' placeholder='Enter your new password' 
                onChange={handleChange} required/>
            </div>
            <div className='mt-4'>
                <Button type='submit'>Submit</Button>
            </div>
        </form>
    </div>
  )
}

export default ChangePassword