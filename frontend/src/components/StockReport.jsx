import { Button, Table } from 'flowbite-react'
import React from 'react'

const StockReport = () => {
  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold text-gray-500'>Reports</h1>
                <Button>Report</Button>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell>Product Name</Table.HeadCell>
                    <Table.HeadCell>Quantity</Table.HeadCell>
                    <Table.HeadCell>Stock Code</Table.HeadCell>
                    <Table.HeadCell>Stock Quantity</Table.HeadCell>
                </Table.Head>
            </Table>
    </div>
  )
}

export default StockReport