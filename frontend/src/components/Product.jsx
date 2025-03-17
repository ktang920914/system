import { Button, Table } from 'flowbite-react'
import React, { useState } from 'react'

const Product = () => {

    const [formData, setFormData] = useState({})
    const [openProductModal, setOpenProductModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

  return (
    <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
   scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
        <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-semibold text-gray-500'>Products</h1>
            <Button>Create product</Button>
        </div>

        <Table hoverable className='shadow-md mt-4'>
            <Table.Head>
            <Table.HeadCell>Product category</Table.HeadCell>
            <Table.HeadCell>Product name</Table.HeadCell>
            <Table.HeadCell>Product picture</Table.HeadCell>
            <Table.HeadCell>Price</Table.HeadCell>
            <Table.HeadCell>Tax</Table.HeadCell>
            <Table.HeadCell>Delete</Table.HeadCell>
            <Table.HeadCell><span>Edit</span></Table.HeadCell>
            </Table.Head>
        </Table>
    </div>
  )
}

export default Product