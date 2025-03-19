import { Alert, Button, Label, Modal, Pagination, Table, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'

const Inventory = () => {

  const [formData, setFormData] = useState({})
  const [errorMessage, setErrorMessage] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [wareHouses, setWareHouses] = useState([])
  const [openEditModal, setOpenEditModal] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7

  useEffect(() => {
    fetchWareHouses()
  },[])

  const fetchWareHouses = async () => {
    const res = await fetch('/api/inventory/get-warehouses')
    const data = await res.json()
    if(res.ok){
      setWareHouses(data)
    }else{
      console.error(error)
    }
  }

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/inventory/create-warehouse',{
        method: 'POST',
        headers: {'Content-type':'application/json'},
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if(res.ok){
        setOpenModal(false)
        setErrorMessage(null)
        setFormData({})
        fetchWareHouses()
      }else{
        setErrorMessage(data.message)
      }
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleDelete = async (inventoryId) => {
    try {
        const res = await fetch(`/api/inventory/delete-warehouse/${inventoryId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
          setWareHouses((prevWarehouse) => prevWarehouse.filter((inventory) => inventory._id !== inventoryId))
        } else {
            console.log(data.message);
        }
    } catch (error) {
        console.log(error.message);
    }
};

  const handleModal = () => {
    setOpenModal(!openModal)
    setErrorMessage(null)
  }

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse)
    setFormData({warehousename:warehouse.warehousename,description:warehouse.description})
    setOpenEditModal(!openEditModal)
    setErrorMessage(null)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/inventory/update-warehouse/${selectedWarehouse._id}`,{
        method: 'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(formData)
      })
      const data = await res.json()
      if(res.ok){
        setErrorMessage(null)
        setOpenEditModal(false)
        fetchWareHouses()
      }else{
        setErrorMessage(data.message)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const totalPages = Math.ceil(wareHouses.length / ITEMS_PER_PAGE);

    const getPaginationData = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return wareHouses.slice(startIndex, endIndex);
    };

  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
        <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-semibold text-gray-500'>Warehouse</h1>
            <Button onClick={() => {handleModal()}}>Create Warehouse</Button>
        </div>

        <Table hoverable className='shadow-md mt-4'>
          <Table.Head>
            <Table.HeadCell>Warehouse</Table.HeadCell>
            <Table.HeadCell>Description</Table.HeadCell>
            <Table.HeadCell>Delete</Table.HeadCell>
            <Table.HeadCell><span>Edit</span></Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {getPaginationData().map((warehouse) => (
                <Table.Row key={warehouse._id}>
                    <Table.Cell>{warehouse.warehousename}</Table.Cell>
                    <Table.Cell>{warehouse.description}</Table.Cell>
                    <Table.Cell>
                        <Button color="failure" onClick={() => handleDelete(warehouse._id)}>Delete</Button>
                    </Table.Cell>
                    <Table.Cell>
                        <Button color="warning" onClick={() => handleEdit(warehouse)}>Edit</Button>
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
                    <h1 className="text-2xl text-gray-500 font-semibold">Create warehouse</h1>
                    {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <div className="mt-4">
                            <Label value="Warehouse Name" />
                            <TextInput type='text' id="warehousename" placeholder="Enter Warehouse Name" onChange={handleChange} required />
                        </div>
                        <div className="mt-4 mb-4">
                            <Label value="Description" />
                            <TextInput type='text' id="description" placeholder="Enter Description" onChange={handleChange}/>
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
                    <h1 className="text-2xl text-gray-500 font-semibold">Update warehouse</h1>
                    {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                    <form onSubmit={handleEditSubmit}>
                        <div className="mt-4">
                            <Label value="Warehouse Name" />
                            <TextInput type='text' id="warehousename" placeholder="Enter Warehouse Name"
                            onChange={handleChange} required />
                        </div>
                        <div className="mt-4 mb-4">
                            <Label value="Description" />
                            <TextInput type='text' id="description" placeholder="Enter Description"
                            onChange={handleChange}/>
                        </div>
                        <Button type='submit'>Submit</Button>
                    </form>
                </div>
            </Modal.Body>
        </Modal>
    </div>
  )
}

export default Inventory