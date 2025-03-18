import { Button, Table } from 'flowbite-react'
import React from 'react'

const Inventory = () => {
  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
        <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-semibold text-gray-500'>Warehouse</h1>
            <Button>Create warehouse</Button>
        </div>

        <Table hoverable className='shadow-md mt-4'>
          <Table.Head>
            <Table.HeadCell>Warehouse</Table.HeadCell>
            <Table.HeadCell>Description</Table.HeadCell>
            <Table.HeadCell></Table.HeadCell>
            <Table.HeadCell>Delete</Table.HeadCell>
            <Table.HeadCell><span>Edit</span></Table.HeadCell>
          </Table.Head>
        </Table>
    </div>
  )
}

export default Inventory