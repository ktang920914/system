import React, { useEffect, useState } from 'react';
import { Button, Table, TextInput } from 'flowbite-react';

const ReserveReport = () => {

  const [formData,setFormData] = useState({})
  
  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  return (
    <div className="w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300">
      <div className="flex items-center justify-between">
        <h1 className="text-gray-500 text-2xl font-semibold">Reports</h1>
        <div className='flex items-center gap-2'>
        <TextInput type="date" id='datereport' onChange={handleChange}/>
        <Button>Report</Button>
        </div>
      </div>

      <Table hoverable className="shadow-md mt-4">
        <Table.Head>
        <Table.HeadCell>Date</Table.HeadCell>
          <Table.HeadCell>Table</Table.HeadCell>
          <Table.HeadCell>Customer (phone)</Table.HeadCell>
          <Table.HeadCell>Reservation</Table.HeadCell>
          <Table.HeadCell>Open</Table.HeadCell>
          <Table.HeadCell>Close</Table.HeadCell>
        </Table.Head>
      </Table>
    </div>
  );
};

export default ReserveReport;