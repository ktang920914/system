import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Pagination, Select } from 'flowbite-react';

const Cashier = () => {
  const [openTables, setOpenTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tableOrders, setTableOrders] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const ITEMS_PER_PAGE = 7;

  // Enhanced safeNumber function with logging and default value
  const safeNumber = (value, fieldName = '', defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
      console.warn(`Empty value for ${fieldName}, using default ${defaultValue}`);
      return defaultValue;
    }
    const num = Number(value);
    if (isNaN(num)) {
      console.error(`Invalid number conversion for ${fieldName}:`, value);
      return defaultValue;
    }
    return num;
  };

  // Fetch all areas
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch('/api/area/get-areas');
        const data = await res.json();
        if (res.ok) {
          setAreas(data);
        }
      } catch (error) {
        console.error('Error fetching areas:', error.message);
      }
    };
    fetchAreas();
  }, []);

  // Fetch order information for each table
  const fetchTableOrders = async () => {
    try {
      const res = await fetch('/api/order/get-orders');
      const data = await res.json();
      if (res.ok) {
        const ordersMap = {};
        
        data.orders.forEach(order => {
          if (order.table) {
            if (ordersMap[order.table._id]) {
              if (order.status !== 'completed') {
                ordersMap[order.table._id] = {
                  hasOrder: true,
                  ordertotal: safeNumber(order.ordertotal, 'ordertotal'),
                  taxtotal: safeNumber(order.taxtotal, 'taxtotal'),
                  status: order.status,
                  ordernumber: order.ordernumber
                };
              }
            } else {
              ordersMap[order.table._id] = {
                hasOrder: order.status !== 'completed',
                ordertotal: safeNumber(order.ordertotal, 'ordertotal'),
                taxtotal: safeNumber(order.taxtotal, 'taxtotal'),
                status: order.status,
                ordernumber: order.ordernumber
              };
            }
          }
        });
        setTableOrders(ordersMap);
      }
    } catch (error) {
      console.error('Error fetching table orders:', error.message);
    }
  };

  // Fetch open tables
  const fetchOpenTables = async () => {
    try {
      const res = await fetch('/api/table/get-tables');
      const data = await res.json();
      if (res.ok) {
        const filteredTables = data.filter(table => {
          const isOpen = table.open?.status;
          const matchesArea = selectedArea ? table.area === selectedArea : true;
          return isOpen && matchesArea;
        });
        setOpenTables(filteredTables);
      }
    } catch (error) {
      console.error('Error fetching open tables:', error.message);
    }
  };

  // Close table
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
        console.error('Failed to close table');
      }
    } catch (error) {
      console.error('Error closing table:', error.message);
    }
  };

  // Enhanced handleCheckPayment function in cashier.jsx
const handleCheckPayment = async (tableId, ordernumber) => {
  setIsProcessing(true);
  try {
    // First fetch all orders for this table
    const orderRes = await fetch(`/api/order/get-orders-by-table/${tableId}`);
    if (!orderRes.ok) {
      throw new Error(`Failed to fetch orders: ${orderRes.status}`);
    }
    
    const orderData = await orderRes.json();
    console.log('All orders for table:', orderData);

    // Find the specific order we want to process
    const order = orderData.orders.find(o => o.ordernumber === ordernumber);
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if order is already completed
    if (order.status === 'completed') {
      throw new Error('This order has already been paid');
    }

    // Enhanced calculateTotals function to properly handle combo items
    const calculateTotals = (items, isCombo = false) => {
      let subtotal = 0;
      let taxtotal = 0;

      items.forEach(item => {
        const quantity = Math.max(0, Number(isCombo ? item.comboproductquantity : item.orderproductquantity) || 0);
        const price = Math.max(0, Number(isCombo ? item.comboproductprice : item.orderproductprice) || 0);
        const taxRate = Math.max(0, Math.min(100, 
            Number(isCombo ? item.comboproducttax : item.orderproducttax) || 0));

        const itemTotal = price * quantity;
        subtotal += itemTotal;
        taxtotal += itemTotal * (taxRate / 100);
      });

      return { subtotal, taxtotal };
    };

    // Calculate regular items
    const regularItems = order.orderitems || [];
    const regularTotals = calculateTotals(regularItems);

    // Calculate combo items - ensure we're using the correct property names
    const comboItems = order.ordercomboitem || [];
    const comboTotals = calculateTotals(comboItems, true);

    // Sum all amounts
    const subtotal = regularTotals.subtotal + comboTotals.subtotal;
    const taxtotal = regularTotals.taxtotal + comboTotals.taxtotal;
    const ordertotal = subtotal + taxtotal;

    console.log('Final calculated totals:', { 
      subtotal, 
      taxtotal, 
      ordertotal,
      regularItems,
      comboItems 
    });

    // Validate calculations
    if (isNaN(subtotal)) throw new Error('Invalid subtotal calculation');
    if (isNaN(taxtotal)) throw new Error('Invalid tax calculation');
    if (isNaN(ordertotal)) throw new Error('Invalid total calculation');
    if (subtotal <= 0) throw new Error('Subtotal must be greater than 0');

    // Update order with new totals and mark as completed
    const updateRes = await fetch(`/api/order/update-order-totals/${ordernumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtotal,
        taxAmount: taxtotal,
        ordertotal,
        status: 'completed'
      })
    });

    if (!updateRes.ok) {
      const errorData = await updateRes.json();
      throw new Error(errorData.message || 'Failed to update order');
    }

    // Refresh data
    await Promise.all([fetchOpenTables(), fetchTableOrders()]);
    alert('Payment processed successfully!');
  } catch (error) {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error.message}`);
  } finally {
    setIsProcessing(false);
  }
};

  // Set up polling for real-time updates
  useEffect(() => {
    fetchOpenTables();
    fetchTableOrders();
    const interval = setInterval(() => {
      fetchOpenTables();
      fetchTableOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedArea]);

  // Handle area filter change
  const handleAreaFilterChange = (e) => {
    setSelectedArea(e.target.value);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(openTables.length / ITEMS_PER_PAGE);

  const getPaginationData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return openTables.slice(startIndex, endIndex);
  };

  // Get card background color based on order status
  const getCardColor = (tableId) => {
    const orderInfo = tableOrders[tableId];
    if (!orderInfo) return 'bg-yellow-200'; // No order info (default)
    
    if (orderInfo.hasOrder && orderInfo.status !== 'completed') {
      return 'bg-red-200';
    }
    return 'bg-yellow-200';
  };

  // Get amount text color based on minimum spent
  const getAmountColor = (table) => {
    const orderInfo = tableOrders[table._id];
    if (!orderInfo) return 'text-gray-600';
    
    const total = safeNumber(orderInfo.ordertotal, 'display total');
    const minSpent = safeNumber(table.minimumspent, 'minimum spent');
    
    return total >= minSpent ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-semibold text-gray-700'>Open Tables</h1>
        <Select 
          id="areaFilter" 
          onChange={handleAreaFilterChange} 
          value={selectedArea}
          className='w-48'
        >
          <option value="">All Areas</option>
          {areas.map((area) => (
            <option key={area._id} value={area._id}>
              {area.areaname}
            </option>
          ))}
        </Select>
      </div>
      
      <div className="grid lg:grid-cols-7 md:grid-cols-4 sm:grid-cols-3 gap-4">
        {getPaginationData().map((table) => {
          const orderInfo = tableOrders[table._id];
          return (
            <Card 
              key={table._id} 
              className={`${getCardColor(table._id)} hover:shadow-md transition-shadow`}
            >
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">{table.tablename}</h3>
                <div className="text-sm space-y-1">
                  <p>Pax: {table.tablepax}</p>
                  <p>Min Spent: RM{safeNumber(table.minimumspent, 'table min spent').toFixed(2)}</p>
                  
                  {orderInfo?.hasOrder && (
                    <>
                      <p className={`font-bold ${getAmountColor(table)}`}>
                        Order Total: RM{safeNumber(orderInfo.ordertotal, 'order total').toFixed(2)}
                      </p>
                      <p className="text-xs">
                        Tax: RM{safeNumber(orderInfo.taxtotal, 'order tax').toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Order #: {orderInfo.ordernumber}</p>
                    </>
                  )}
                  
                  <p>Customer: {table.open?.customername || '-'}</p>
                  <p>Phone: {table.open?.phonenumber || '-'}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Badge
                    color="failure" 
                    size="xs"
                    className='cursor-pointer'
                    onClick={() => handleCloseTable(table._id)}
                    disabled={isProcessing}
                  >
                    Close Table
                  </Badge>
                  
                  {orderInfo?.hasOrder && orderInfo.status !== 'completed' && (
                    <Button 
                      color='success'
                      size="xs"
                      onClick={() => handleCheckPayment(table._id, orderInfo.ordernumber)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Check Payment'}
                    </Button>
                  )}
                  
                  {orderInfo?.hasOrder && (
                    <Badge 
                      color={orderInfo.status === 'completed' ? "success" : "warning"} 
                      className="text-center"
                    >
                      {orderInfo.status === 'completed' ? 'Paid' : 'Pending'}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {openTables.length > ITEMS_PER_PAGE && (
        <div className='flex justify-center mt-6'>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showIcons
          />
        </div>
      )}
    </div>
  );
};

export default Cashier;