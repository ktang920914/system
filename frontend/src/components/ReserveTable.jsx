import { Alert, Button, Card, Label, Modal, Pagination, Select, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'

const ReserveTable = () => {

    const [tables, setTables] = useState([])
    const [areas, setAreas] = useState([])
    const [formData, setFormData] = useState({})
    const [openModal, setOpenModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedArea, setSelectedArea] = useState('')
    const ITEMS_PER_PAGE = 14
    console.log(formData)

    useEffect(() => {
        const FetchAreas = async () => {
          try {
            const res = await fetch('/api/area/get-areas')
            const data = await res.json()
            if(res.ok){
              setAreas(data)
            }
          } catch (error) {
            console.log(error.message)
          }
        }
        FetchAreas()
      },[])

    useEffect(() => {
        const FetchTables = async () => {
          try {
            const res = await fetch('/api/table/get-tables')
            const data = await res.json()
            if(res.ok){
              const sortedTables = data.sort((a, b) => {
                const aNumber = parseInt(a.tablename.match(/\d+/)[0]);
                const bNumber = parseInt(b.tablename.match(/\d+/)[0]);
                if (aNumber !== bNumber) {
                  return bNumber - aNumber;
                }
                return new Date(b.updatedAt) - new Date(a.updatedAt);
              });
              setTables(sortedTables)
            }
          } catch (error) {
            console.log(error.message)
          }
        }
        FetchTables()
    },[])

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  const handleModal = () => {
    setOpenModal(!openModal)
    setErrorMessage(null)
  }

  const handleSubmit = async (e) => {

  }

  const handleAreaFilterChange = (e) => {
    setSelectedArea(e.target.value)
    setCurrentPage(1)
  }

  const filteredTables = selectedArea ? tables.filter(table => table.area === selectedArea) : tables

  const totalPages = Math.ceil(filteredTables.length / ITEMS_PER_PAGE)

  const getPaginationData = () => {
      const startIndex = (currentPage - 1)* ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      return filteredTables.slice(startIndex, endIndex)
  }

  return (
    <div className='w-full max-w-4xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
   scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
        <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-gray-500'>Reserves</h1>
        <div className='flex items-center gap-2'>
            <Select id='areaFilter' onChange={handleAreaFilterChange} value={selectedArea}>
            <option value=''>All Areas</option>
            {areas.map((area) => (
                <option key={area._id} value={area._id}>{area.areaname}</option>
            ))}
            </Select>
            <Button onClick={handleModal}>Reserve Table</Button>
        </div>
        </div>

        <div className='grid lg:grid-cols-7 md:grid-cols-5 sm:grid-cols-4 gap-4 mt-4'>
            {getPaginationData().map((table) => (
                <Card key={table._id} className='bg-green-200 break-words'>
                    <h3 className="text-lg font-semibold">{table.tablename}</h3>
                    <p>Pax: {table.tablepax}</p>
                    <p>Min Spent: RM{table.minimumspent}</p>
                </Card>
            ))}
        </div>

        <div className='flex justify-center mt-4'>
            <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            />
        </div>

        <Modal show={openModal} size="md" popup onClose={() => setOpenModal(false)}>
          <Modal.Header />
          <Modal.Body>
            <div className="space-y-2">
              <h1 className="text-2xl text-gray-500 font-semibold">Reserve table</h1>
                  {
                      errorMessage && (
                          <Alert color='failure'>
                              {errorMessage}
                          </Alert>
                      )
                  }
                  <form onSubmit={handleSubmit}>
                      <div className="mt-4">
                          <Label value="Customer name" />
                          <TextInput type='text' id='customername' placeholder='Enter customer name'onChange={handleChange}required/>
                      </div>
                      <div className="mt-4 mb-4">
                          <Label value="Customer phone" />
                          <TextInput type='text' id='phonenumber' placeholder='Enter phone number'onChange={handleChange} required/>
                      </div>
                      <div className="mt-4 mb-4">
                          <Label value="Pax" />
                          <TextInput type='number' id='pax' placeholder='Enter pax'onChange={handleChange} required/>
                      </div>
                      <Button type='submit'>Submit</Button>
                  </form>
            </div>
          </Modal.Body>
        </Modal>
   </div>
  )
}

export default ReserveTable