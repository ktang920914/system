import { Button, Modal } from 'flowbite-react'
import React, { useState } from 'react'

const Bill = () => {

  const [formData, setFormData] = useState({})
  const [openPaymentModal, setOpenPaymentModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  const handlePaymentModal = () => {
    setOpenPaymentModal(!openPaymentModal)
  }

  return (
    <div className='w-full max-w-4xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
   scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
    <div className='flex items-center justify-between'>
        <h1 className='text-2xl text-gray-500 font-semibold'>Bills</h1>
        <Button onClick={() => {handlePaymentModal()}}>Payment</Button>
    </div>

    <Modal show={openPaymentModal} size="md" popup onClose={() => setOpenPaymentModal(false)}>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-2">
          <h1 className="text-2xl text-gray-500 font-semibold">Create area</h1>
              {
                  errorMessage && (
                      <Alert color='failure'>
                          {errorMessage}
                      </Alert>
                  )
              }
              <form onSubmit={handleSubmit}>
                  <div className="mt-4">
                      <Label value="Area" />
                      <TextInput type='text' id="areaname" placeholder="A B C" onChange={handleChange} required/>
                  </div>
                  
                  <div className="mt-4">
                      <Label value="Description" />
                      <TextInput type='text' id='description' placeholder='Enter your description' onChange={handleChange}/>
                  </div>
                  
                  <div className='my-4'>
                      <Label value='Category'/>
                      <Select id="category" onChange={handleChange} required>
                          <option value='Uncategory'>Select category</option>
                          <option value='REGULAR'>REGULAR</option>
                          <option value='VIP'>VIP</option>
                          <option value='VVIP'>VVIP</option>
                          <option value='SVIP'>SVIP</option>
                      </Select>
                  </div>
                  <Button type='submit'>Submit</Button>
              </form>
        </div>
      </Modal.Body>
    </Modal>

   </div>
  )
}

export default Bill