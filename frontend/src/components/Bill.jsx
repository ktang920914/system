import { Button, Label, Modal, Select, TextInput } from 'flowbite-react'
import React, { useState } from 'react'

const Bill = () => {

  const [formData, setFormData] = useState({})
  const [openPaymentModal, setOpenPaymentModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

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
          <h1 className="text-2xl text-gray-500 font-semibold">Make payment</h1>
              {
                  errorMessage && (
                      <Alert color='failure'>
                          {errorMessage}
                      </Alert>
                  )
              }
              <form onSubmit={handleSubmit}>
                  <div className='mt-4'>
                      <Label value='Payment Type'/>
                      <Select id="paymenttype" onChange={handleChange} required>
                          <option value='Uncategory'>Select category</option>
                          <option value='CASH'>CASH</option>
                          <option value='CARD'>CARD</option>
                          <option value='EWALLET'>EWALLET</option>
                          <option value='BANK TRANSFER'>BANK TRANSFER</option>
                      </Select>
                  </div><div className='mt-4'>
                      <Label value='Payment Providers/Networks'/>
                      <Select id="paymenttype" onChange={handleChange} required>
                          <option value='Uncategory'>Select category</option>
                          <option value='REGULAR'>CASH</option>
                          <option value='VIP'>CARD</option>
                          <option value='VVIP'>EWALLET</option>
                          <option value='SVIP'>BANK TRANSFER</option>
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