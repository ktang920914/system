import { Alert, Button, Label, Modal, Pagination, Select, Table, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'

const Area = () => {

    const [openModal, setOpenModal] = useState(false)
    const [formData, setFormData] = useState({})
    const [errorMessage, setErrorMessage] = useState(null)
    const [areas, setAreas] = useState([])
    const [openEditModal, setOpenEditModal] = useState(false)
    const [selectedArea, setSelectedArea] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 7

    useEffect(() => {
        const fetchAreas = async () => {
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
        fetchAreas()
    },[])

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/area/create-area', {
                method: 'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
            }
            if(res.ok){
                setOpenModal(false)
                setErrorMessage(null)
                const res = await fetch('/api/area/get-areas')
                const data = await res.json()
                if(res.ok){
                    setAreas(data)
                }
            }
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    const handleModal = () => {
        setOpenModal(!openModal)
        setErrorMessage(null)
    }

    const handleDelete = async (areaId) => {
        try {
            const res = await fetch(`/api/area/delete-area/${areaId}`,{
                method: 'DELETE'
            })
            const data = await res.json()
            if(res.ok){
                setAreas((prevAreas) => prevAreas.filter((area) => area._id !== areaId))
            }else{
                console.log(data.message)
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            const isDuplicate = areas.some(area => 
                area.areaname === formData.areaname && area._id !== selectedArea._id
            )
            if(isDuplicate) {
                setErrorMessage('Area name already exists')
                return
            }
            const res = await fetch(`/api/area/update-area/${selectedArea._id}`,{
                method: 'PUT',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if(res.ok){
                setOpenEditModal(false)
                setErrorMessage(null)
                const updatedAreas = areas.map(area => area._id === selectedArea._id ? data : area)
                setAreas(updatedAreas)
                const res = await fetch('/api/area/get-areas')
                const newData = await res.json()
                if(res.ok){
                    setAreas(newData)
                }
            }else{
                setErrorMessage(data.message)
            }
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    const handleEditModal = (area) => {
        setSelectedArea(area)
        setFormData({areaname:area.areaname,description:area.description,category:area.category})
        setOpenEditModal(!openEditModal)
        setErrorMessage(null)
    }

    const totalPages = Math.ceil(areas.length / ITEMS_PER_PAGE)

    const getPaginationData = () => {
        const startIndex = (currentPage - 1)* ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        return areas.slice(startIndex, endIndex)
    }

  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
   scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
        <div className='flex items-center justify-between'>
            <h1 className='text-2xl text-gray-500 font-semibold'>Areas</h1>
            <Button onClick={handleModal}>Create Area</Button>
        </div>
        <Table hoverable className='shadow-md mt-4'>
          <Table.Head>
            <Table.HeadCell>Date</Table.HeadCell>
            <Table.HeadCell>Area name</Table.HeadCell>
            <Table.HeadCell>Desciption</Table.HeadCell>
            <Table.HeadCell>Catergory</Table.HeadCell>
            <Table.HeadCell>Delete</Table.HeadCell>
            <Table.HeadCell><span>Edit</span></Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {getPaginationData().map((area) => (
                <Table.Row key={area._id}>
                    <Table.Cell>{new Date(area.updatedAt).toLocaleDateString()}</Table.Cell>
                    <Table.Cell>{area.areaname}</Table.Cell>
                    <Table.Cell>{area.description}</Table.Cell>
                    <Table.Cell>{area.category}</Table.Cell>
                    <Table.Cell>
                        <Button color="failure" onClick={() => {handleDelete(area._id)}}>Delete</Button>
                    </Table.Cell>
                    <Table.Cell>
                        <Button color="warning" onClick={() => {handleEditModal(area)}}>Edit</Button>
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

      <Modal show={openEditModal} size="md" popup onClose={() => setOpenEditModal(false)}>
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-2">
            <h1 className="text-2xl text-gray-500 font-semibold">Update area</h1>
                {
                    errorMessge && (
                        <Alert color='failure'>
                            {errorMessge}
                        </Alert>
                    )
                }
                <form onSubmit={handleEditSubmit}>
                    <div className="mt-4">
                        <Label value="Area" />
                        <TextInput type='text' id="areaname" placeholder="A B C" onChange={handleChange}
                        value={formData.areaname} required/>
                    </div>
                    
                    <div className="mt-4">
                        <Label value="Description" />
                        <TextInput type='text' id='description' placeholder='Enter your description' onChange={handleChange}
                        value={formData.description}/>
                    </div>
                    
                    <div className='my-4'>
                        <Label value='Category'/>
                        <Select id="category" onChange={handleChange} value={formData.category} required>
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

export default Area