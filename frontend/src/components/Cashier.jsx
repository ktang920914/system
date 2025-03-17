import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Pagination, Select } from 'flowbite-react';

const Cashier = () => {
  const [openTables, setOpenTables] = useState([]);
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  useEffect(() => {
      const FetchAreas = async () => {
        try {
          const res = await fetch('/api/area/get-areas');
          const data = await res.json();
          if (res.ok) {
            setAreas(data);
          }
        } catch (error) {
          console.log(error.message);
        }
      };
      FetchAreas();
    }, []);

  // 获取已打开的桌子
  const fetchOpenTables = async () => {
    try {
      const res = await fetch('/api/table/get-tables');
      const data = await res.json();
      if (res.ok) {
        // 根据选择的区域过滤桌子
        const filteredTables = data.filter(table => {
          const isOpen = table.open.status;
          const matchesArea = selectedArea ? table.area === selectedArea : true;
          return isOpen && matchesArea;
        });
        setOpenTables(filteredTables);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // 关闭桌子
  const handleCloseTable = async (tableId) => {
    try {
      const res = await fetch(`/api/table/toggle-open-status/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          open: {
            status: false, // 将 open.status 设置为 false
          },
        }),
      });
      if (res.ok) {
        // 重新获取桌子数据
        fetchOpenTables();
      } else {
        console.log('Failed to close table');
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // 初始化时获取桌子数据，并设置定时器
  useEffect(() => {
    fetchOpenTables();
    const interval = setInterval(fetchOpenTables, 10000); // 每10秒更新一次

    return () => clearInterval(interval); // 清除定时器
  }, [selectedArea]); // 添加 selectedArea 作为依赖项

  const handleAreaFilterChange = (e) => {
    setSelectedArea(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(openTables.length / ITEMS_PER_PAGE)

    const getPaginationData = () => {
        const startIndex = (currentPage - 1)* ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        return openTables.slice(startIndex, endIndex)
    }

  return (
    <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-gray-500'>Open Tables</h1>
        <Select id="areaFilter" onChange={handleAreaFilterChange} value={selectedArea}>
            <option value="">All Areas</option>
            {areas.map((area) => (
                <option key={area._id} value={area._id}>
                {area.areaname}
                </option>
            ))}
        </Select>
      </div>
      <div className="grid lg:grid-cols-7 md:grid-cols-4 sm:grid-cols-3 gap-4 mt-4">
        {getPaginationData().map((table) => (
          <Card key={table._id} className="bg-yellow-200">
            <h3 className="text-lg font-semibold">{table.tablename}</h3>
            <p className='text-sm'>Pax: {table.tablepax}</p>
            <p className='text-sm'>Min Spent: RM{table.minimumspent}</p>
            <p className='text-sm'>Customer: {table.open.customername}</p>
            <p className='text-sm'>Phone: {table.open.phonenumber}</p>
            <Badge color="failure" className="cursor-pointer flex justify-center" 
                onClick={() => handleCloseTable(table._id)}>Close
            </Badge>
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
  );
};

export default Cashier;