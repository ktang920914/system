import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Pagination, Select } from 'flowbite-react';

const Cashier = () => {
  const [openTables, setOpenTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tableOrders, setTableOrders] = useState({}); // 存储每个桌子的订单信息
  const ITEMS_PER_PAGE = 7;

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

  // 获取每个桌子的订单状态和总金额
  const fetchTableOrders = async () => {
    try {
      const res = await fetch('/api/order/get-orders');
      const data = await res.json();
      if (res.ok) {
        // 创建一个对象，存储每个桌子的订单信息
        const ordersMap = {};
        data.orders.forEach(order => {
          if (order.table && order.status !== 'completed') {
            ordersMap[order.table._id] = {
              hasOrder: true,
              ordertotal: order.ordertotal
            };
          }
        });
        setTableOrders(ordersMap);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

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
            status: false,
          },
        }),
      });
      if (res.ok) {
        fetchOpenTables();
        fetchTableOrders();
      } else {
        console.log('Failed to close table');
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    fetchOpenTables();
    fetchTableOrders();
    const interval = setInterval(() => {
      fetchOpenTables();
      fetchTableOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedArea]);

  const handleAreaFilterChange = (e) => {
    setSelectedArea(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(openTables.length / ITEMS_PER_PAGE);

  const getPaginationData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return openTables.slice(startIndex, endIndex);
  };

  // 根据订单状态获取卡片背景颜色
  const getCardColor = (tableId) => {
    return tableOrders[tableId]?.hasOrder ? 'bg-red-200' : 'bg-yellow-200';
  };

  // 根据订单金额和最低消费获取金额显示颜色
  const getAmountColor = (table) => {
    const orderInfo = tableOrders[table._id];
    if (!orderInfo) return 'text-gray-500'; // 没有订单时默认颜色
    
    return orderInfo.ordertotal >= table.minimumspent 
      ? 'text-green-500' 
      : 'text-red-500';
  };

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
        {getPaginationData().map((table) => {
          const orderInfo = tableOrders[table._id];
          return (
            <Card key={table._id} className={getCardColor(table._id)}>
              <h3 className="text-lg font-semibold">{table.tablename}</h3>
              <p className='text-sm'>Pax: {table.tablepax}</p>
              <p className='text-sm'>Min Spent: RM{table.minimumspent}</p>
              {orderInfo?.hasOrder && (
                <p className={`text-sm font-bold ${getAmountColor(table)}`}>
                  Order Total: RM{orderInfo.ordertotal}
                </p>
              )}
              <p className='text-sm'>Customer: {table.open.customername}</p>
              <p className='text-sm'>Phone: {table.open.phonenumber}</p>
              <Badge 
                color="failure" 
                className="cursor-pointer flex justify-center" 
                onClick={() => handleCloseTable(table._id)}
              >
                Close
              </Badge>
              {orderInfo?.hasOrder && (
                <Badge color="success" className="flex justify-center mt-2">
                  Ordered
                </Badge>
              )}
            </Card>
          );
        })}
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