import { Alert, Button, Label, Modal, Pagination, Select, Table, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'

const Tables = () => {

  const [openModal, setOpenModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [errorMessge, setErrorMessage] = useState(null)
  const [formData, setFormData] = useState({})
  const [areas, setAreas] = useState([])
  const [tables, setTables] = useState([])
  const [currentTable, setCurrentTable] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedArea, setSelectedArea] = useState('')
  const ITEMS_PER_PAGE = 7

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const {area, tablename, tablepax, minimumspent} = formData
      if(tablename < 1 || tablename > 100){
        return setErrorMessage('Table number must be between 1-100')
      }
      if(tablepax < 1){
        return setErrorMessage('Table pax must be at least 1')
      }
      if(minimumspent < 0 || minimumspent > 99999 ){
        return setErrorMessage('Minium spent must be between 0-99999')
      }
      const selectedArea = areas.find(a => a._id === area);
      const areaName = selectedArea ? selectedArea.areaname : ''
      const tablenames = Array.from({length:tablename}, (_,i) => `${areaName}${i+1}`)
      const res = await fetch('/api/table/create-table',{
        method: 'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({tablenames, tablepax, minimumspent, area})
      })
      const data = await res.json()
      if(res.ok){
        setOpenModal(false)
        setErrorMessage(null)
        const res = await fetch('/api/table/get-tables')
        const data = await res.json()
        if(res.ok){
          setTables(data)
        }
      }else{
        setErrorMessage(data.message)
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  const handleModal = () => {
    setOpenModal(!openModal)
    setErrorMessage(null)
  }

  const handleDelete = async (tableId) => {
    try {
      const res = await fetch(`/api/table/delete-table/${tableId}`,{
        method: 'DELETE',
      })
      const data = await res.json()
      if(res.ok){
        setTables((prevTables) => prevTables.filter((table) => table._id !== tableId))
      }else{
        console.log(data.message)
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const handleAreaFilterChange = (e) => {
    setSelectedArea(e.target.value)
    setCurrentPage(1)
  }

  const filterTables = selectedArea 
  ? tables.filter(table => table.area === selectedArea).sort((a, b) => {
      const aNumber = parseInt(a.tablename.match(/\d+/)[0]);
      const bNumber = parseInt(b.tablename.match(/\d+/)[0]);

      if (aNumber !== bNumber) {
        return bNumber - aNumber;
      }

      return new Date(b.updatedAt) - new Date(a.updatedAt);
    })
  : tables.sort((a, b) => {
      const aNumber = parseInt(a.tablename.match(/\d+/)[0]);
      const bNumber = parseInt(b.tablename.match(/\d+/)[0]);

      if (aNumber !== bNumber) {
        return bNumber - aNumber;
      }

      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  const handleEditModal = (table) => {
    setFormData(table)
    setCurrentTable(table.tablename)
    setOpenEditModal(!openEditModal)
    setErrorMessage(null)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const { tablepax, minimumspent } = formData;
  
      if (tablepax < 1) {
        return setErrorMessage('Table pax must be at least 1');
      }
      if (minimumspent < 0 || minimumspent > 99999) {
        return setErrorMessage('Minimum spent must be between 0-99999');
      }
  
      const tableId = formData._id;
  
      const res = await fetch(`/api/table/update-table/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tablepax, minimumspent }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setOpenEditModal(false);
        setErrorMessage(null);
        const res = await fetch('/api/table/get-tables');
        const data = await res.json();
        if (res.ok) {
          setTables(data);
        }
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error(error.message);
      setErrorMessage('An error occurred while updating the table.');
    }
  };

  const totalPages = Math.ceil(filterTables.length / ITEMS_PER_PAGE)

  const getPaginationData = () => {
      const startIndex = (currentPage - 1)* ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      return filterTables.slice(startIndex, endIndex)
  }

  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
   scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
        <div className='flex items-center justify-between'>
            <h1 className='text-2xl text-gray-500 font-semibold'>Tables</h1>
            <div className='flex items-center gap-2'>
              <Select id='areaFilter' onChange={handleAreaFilterChange} value={selectedArea}>
                <option value=''>All Areas</option>
                {areas.map((area) => (
                  <option key={area._id} value={area._id}>{area.areaname}</option>
                ))}
              </Select>
              <Button onClick={handleModal}>Create Table</Button>
            </div>
        </div>

        <Table hoverable className='shadow-md mt-4'>
            <Table.Head>
                <Table.HeadCell>Date</Table.HeadCell>
                <Table.HeadCell>Table name</Table.HeadCell>
                <Table.HeadCell>Pax</Table.HeadCell>
                <Table.HeadCell>Minimum Spent</Table.HeadCell>
                <Table.HeadCell>Delete</Table.HeadCell>
                <Table.HeadCell><span>Edit</span></Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {getPaginationData().map((table) => (
                <Table.Row key={table._id}>
                  <Table.Cell>{new Date(table.updatedAt).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>{table.tablename}</Table.Cell>
                  <Table.Cell>{table.tablepax}</Table.Cell>
                  <Table.Cell>RM {table.minimumspent}</Table.Cell>
                  <Table.Cell>
                    <Button color="failure"onClick={() => {handleDelete(table._id)}}>Delete</Button>
                  </Table.Cell>
                  <Table.Cell>
                    <Button color="warning"onClick={() => {handleEditModal(table)}}>Edit</Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
        </Table>

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
              <h1 className="text-2xl text-gray-500 font-semibold">Create table</h1>
                  {
                      errorMessge && (
                          <Alert color='failure'>
                              {errorMessge}
                          </Alert>
                      )
                  }
                  <form onSubmit={handleSubmit}>
                      <div className="mt-4">
                          <Label value="Area" />
                          <Select id='area' onChange={handleChange}required>
                          <option value=''>Select area</option>
                          {areas.map((area) => (
                            <option key={area._id} value={area._id}>{area.areaname}</option>
                          ))}
                          </Select>
                      </div>
                      <div className="mt-4">
                          <Label value="Table number" />
                          <TextInput type='number' id="tablename" placeholder="Enter Tables number (1-100)"
                          onChange={handleChange} required/>
                      </div>
                      <div className="mt-4">
                          <Label value="Pax" />
                          <TextInput type='number' id='tablepax' placeholder='Enter pax' onChange={handleChange}required/>
                      </div>
                      <div className="mt-4 mb-4">
                          <Label value="Minimum spent" />
                          <TextInput type='number' id='minimumspent' placeholder='Enter minimum spent' onChange={handleChange}required/>
                      </div>
                      <Button type='submit'>Submit</Button>
                  </form>
            </div>
          </Modal.Body>
        </Modal>

        <Modal show={openEditModal} size="md" popup onClose={() => setOpenEditModal(false)}>
          <Modal.Header />
          <Modal.Body>
            <div className="space-y-2">
              <h1 className="text-2xl text-gray-500 font-semibold">Update {currentTable} table</h1>
                  {
                      errorMessge && (
                          <Alert color='failure'>
                              {errorMessge}
                          </Alert>
                      )
                  }
                  <form onSubmit={handleEditSubmit}>
                      <div className="mt-4">
                          <Label value="Pax" />
                          <TextInput type='number' id='tablepax' placeholder='Enter pax'
                          value={formData.tablepax} onChange={handleChange}required/>
                      </div>
                      <div className="mt-4 mb-4">
                          <Label value="Minimum spent" />
                          <TextInput type='number' id='minimumspent' placeholder='Enter minimum spent'
                          value={formData.minimumspent} onChange={handleChange}required/>
                      </div>
                      <Button type='submit'>Submit</Button>
                  </form>
            </div>
          </Modal.Body>
        </Modal>
   </div>
  )
}

export default Tables