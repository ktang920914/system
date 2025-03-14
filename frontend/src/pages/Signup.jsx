import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Signup = () => {

    const navigate = useNavigate()
    const [formData, setFormData] = useState({})
    const [errorMessage, setErrorMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    
    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            setErrorMessage(null)
            const res = await fetch('/api/auth/signup',{
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                setLoading(false)
                setErrorMessage(data.message)
            }
            if(res.ok){
                navigate('/')
            }
        } catch (error) {
            console.log(error.message)
        }
    }
  return (
    <div className='flex items-center justify-center min-h-screen'>
        <div className='w-full max-w-md bg-white p-8 rounded-lg shadow-lg'>
            <h1 className='text-2xl text-gray-500 font-semibold text-center'>Sign up</h1>

            {
                errorMessage && (
                    <Alert color='failure' className='my-2'>
                        {errorMessage}
                    </Alert>
                )
            }

            <form onSubmit={handleSubmit}>
                <div className='mb-4'>
                <Label value='Username'/>
                <TextInput type='text' id='username' placeholder='Enter your username' onChange={handleChange} required/>
                </div>
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
                        loading ? <Spinner size='sm'/> : 'Sign up' 
                    }
                </Button>
            </form>

            <div className='mt-4'>
                <p className='text-gray-500 text-sm'>Already have an account?
                    <Link to='/'>
                    <span className='text-blue-500 text-sm cursor-pointer hover:font-semibold'> Sign in
                    </span>
                    </Link>
                </p>
            </div>
        </div>
    </div>
  )
}

export default Signup