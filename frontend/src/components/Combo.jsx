import { Button, Table } from 'flowbite-react'
import React from 'react'

const Combo = () => {
  return (
    <div className='w-full max-w-4xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
       scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl text-gray-500 font-semibold'>Combos</h1>
                <Button>Create combo</Button>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                <Table.HeadCell>Combo Name</Table.HeadCell>
                <Table.HeadCell>Option</Table.HeadCell>
                <Table.HeadCell>Product Name</Table.HeadCell>
                <Table.HeadCell>Quantity</Table.HeadCell>
                <Table.HeadCell>Delete</Table.HeadCell>
                <Table.HeadCell><span>Edit</span></Table.HeadCell>
                </Table.Head>
            </Table>
    </div>
  )
}

export default Combo