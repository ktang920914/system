import { Button, Table } from 'flowbite-react'
import React from 'react'

const Tables = () => {
  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
   scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
        <div className='flex items-center justify-between'>
            <h1 className='text-2xl text-gray-500 font-semibold'>Tables</h1>
            <Button>Create Table</Button>
        </div>

        <Table hoverable className='shadow-md mt-4'>
            <Table.Head>
                <Table.HeadCell>Date</Table.HeadCell>
                <Table.HeadCell>Table number</Table.HeadCell>
                <Table.HeadCell>Pax</Table.HeadCell>
                <Table.HeadCell>Catergory</Table.HeadCell>
                <Table.HeadCell>Delete</Table.HeadCell>
                <Table.HeadCell><span>Edit</span></Table.HeadCell>
            </Table.Head>
        </Table>
   </div>
  )
}

export default Tables