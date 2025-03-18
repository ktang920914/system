import { Button } from 'flowbite-react'
import React from 'react'

const Printer = () => {
  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
   scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
        <div className='flex items-center justify-between'>
            <h1 className='text-gray-500 font-semibold text-2xl'>Printers</h1>
            <Button>Create printer</Button>
        </div>
   </div>
  )
}

export default Printer