import { Button, Label, Modal, Select, Table, TextInput } from 'flowbite-react'
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

    <Table hoverable className='shadow-md mt-4'>
      <Table.Head>
          <Table.HeadCell>Date</Table.HeadCell>
          <Table.HeadCell>Order Number</Table.HeadCell>
          <Table.HeadCell>Products</Table.HeadCell>
          <Table.HeadCell>Delete</Table.HeadCell>
          <Table.HeadCell><span>Edit</span></Table.HeadCell>
      </Table.Head>
    </Table>

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
                          <option value='VISA'>VISA</option>
                          <option value='MASTER'>MASTER</option>
                          <option value='EWALLET-TNG'>EWALLET-TNG</option>
                          <option value='DUITNOW'>DUITNOW</option>
                          <option value='BANK-TRANSFER'>BANK-TRANSFER</option>
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