import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { signInStart, signInSuccess, signInFailure, clearError } from '../redux/user/userSlice'

const Signin = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const {loading, error: errorMessage} = useSelector(state => state.user)
    const [formData, setFormData] = useState({})

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    useEffect(() => {
        dispatch(clearError())
    },[dispatch])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            dispatch(signInStart())
            const res = await fetch('/api/auth/signin',{
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                dispatch(signInFailure(data.message))
            }
            if(res.ok){
                navigate('/dashboard')
                dispatch(signInSuccess(data))
            }
        } catch (error) {
            dispatch(signInFailure(error.message))
        }
    }
  return (
    <div className='flex items-center justify-center min-h-screen'>
        <div className='w-full max-w-md bg-white p-8 rounded-lg shadow-lg'>
            <h1 className='text-2xl text-gray-500 font-semibold text-center'>Sign in</h1>

            {
                errorMessage && (
                    <Alert color='failure' className='my-2'>
                        {errorMessage}
                    </Alert>
                )
            }

            <form onSubmit={handleSubmit}>
                <div className='mb-4'>
                <Label value='ID'/>
                <TextInput type='text' id='userid' placeholder='Enter your ID' onChange={handleChange} required/>
                </div>
                <div className='mb-4'>
                <Label value='Password'/>
                <TextInput type='password' id='password' placeholder='Enter your password' onChange={handleChange} required/>
                </div>
                <Button className='w-full' type='submit' disabled={loading}>
                    {
                        loading ? <Spinner size='sm'/> : 'Sign in'
                    }
                </Button>
            </form>

            <div className='mt-4'>
                <p className='text-gray-500 text-sm'>Dont have an account?
                    <Link to='/signup'>
                    <span className='text-blue-500 text-sm cursor-pointer hover:font-semibold'> Sign up
                    </span>
                    </Link>
                </p>
            </div>
        </div>
    </div>
  )
}

export default Signin