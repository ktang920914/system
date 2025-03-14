import { Button, Card, Pagination, Select } from 'flowbite-react'
import React, { useEffect, useState } from 'react'

const ReserveTable = () => {

    const [tables, setTables] = useState([])
    const [areas, setAreas] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedArea, setSelectedArea] = useState('')
    const ITEMS_PER_PAGE = 15

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

  const handleModal = () => {

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

        <div className='grid lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 gap-4 mt-4'>
            {getPaginationData().map((table) => (
                <Card key={table._id} className='bg-green-200'>
                    <h3 className="text-lg font-semibold">{table.tablename}</h3>
                    <p>Pax : {table.tablepax}</p>
                    <p>Minimum Spent : RM{table.minimumspent}</p>
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
   </div>
  )
}

export default ReserveTable