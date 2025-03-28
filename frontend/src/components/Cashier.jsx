import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Pagination, Select, Modal } from 'flowbite-react';

const Cashier = () => {
  const [openTables, setOpenTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tableOrders, setTableOrders] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const ITEMS_PER_PAGE = 7;

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

  // Check if table close should be disabled
  const isTableCloseDisabled = (tableId) => {
    const orderInfo = tableOrders[tableId];
    return orderInfo?.hasOrder && orderInfo.status !== 'completed';
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
                  ordernumber: order.ordernumber,
                  paymentType: order.paymentType
                };
              }
            } else {
              ordersMap[order.table._id] = {
                hasOrder: order.status !== 'completed',
                ordertotal: safeNumber(order.ordertotal, 'ordertotal'),
                taxtotal: safeNumber(order.taxtotal, 'taxtotal'),
                status: order.status,
                ordernumber: order.ordernumber,
                paymentType: order.paymentType
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

  // Fetch open tables with sorting and filtering
  const fetchOpenTables = async () => {
    try {
      const res = await fetch('/api/table/get-tables');
      const data = await res.json();
      if (res.ok) {
        let filteredTables = data.filter(table => {
          const isOpen = table.open?.status;
          const matchesArea = selectedArea ? table.area === selectedArea : true;
          return isOpen && matchesArea;
        });

        // Apply sorting
        filteredTables = sortTables(filteredTables);

        setOpenTables(filteredTables);
      }
    } catch (error) {
      console.error('Error fetching open tables:', error.message);
    }
  };

  // Sort tables based on selected option
  const sortTables = (tables) => {
    const sortedTables = [...tables];
    
    switch (sortBy) {
      case 'hasOrder':
        return sortedTables.sort((a, b) => {
          const aHasOrder = tableOrders[a._id]?.hasOrder ? 1 : 0;
          const bHasOrder = tableOrders[b._id]?.hasOrder ? 1 : 0;
          return bHasOrder - aHasOrder;
        });
      case 'noOrder':
        return sortedTables.sort((a, b) => {
          const aHasOrder = tableOrders[a._id]?.hasOrder ? 1 : 0;
          const bHasOrder = tableOrders[b._id]?.hasOrder ? 1 : 0;
          return aHasOrder - bHasOrder;
        });
      default:
        return sortedTables;
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

  const handleCheckPayment = (tableId, ordernumber) => {
    setCurrentTable(tableId);
    setCurrentOrderNumber(ordernumber);
    setShowPaymentTypeModal(true);
  };

  const handleSubmitPayment = async () => {
    setIsProcessing(true);
    try {
      // First fetch all orders for this table
      const orderRes = await fetch(`/api/order/get-orders-by-table/${currentTable}`);
      if (!orderRes.ok) {
        throw new Error(`Failed to fetch orders: ${orderRes.status}`);
      }
      
      const orderData = await orderRes.json();
      
      // Find the specific order we want to process
      const order = orderData.orders.find(o => o.ordernumber === currentOrderNumber);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order is already completed
      if (order.status === 'completed') {
        throw new Error('This order has already been paid');
      }

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

      // Calculate combo items
      const comboItems = order.ordercomboitem || [];
      const comboTotals = calculateTotals(comboItems, true);

      // Sum all amounts
      const subtotal = regularTotals.subtotal + comboTotals.subtotal;
      const taxtotal = regularTotals.taxtotal + comboTotals.taxtotal;
      const ordertotal = subtotal + taxtotal;

      // Update order with new totals, mark as completed, and set payment type
      const updateRes = await fetch(`/api/order/update-order-totals/${currentOrderNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotal,
          taxAmount: taxtotal,
          ordertotal,
          status: 'completed',
          paymentType: paymentType
        })
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.message || 'Failed to update order');
      }

      // Refresh data
      await Promise.all([fetchOpenTables(), fetchTableOrders()]);
      
      // Show success modal
      setPaymentMessage('Payment processed successfully!');
      setPaymentStatus('success');
      setShowPaymentModal(true);
      setShowPaymentTypeModal(false);
    } catch (error) {
      console.error('Payment error:', error);
      // Show error modal
      setPaymentMessage(`Payment failed: ${error.message}`);
      setPaymentStatus('error');
      setShowPaymentModal(true);
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
  }, [selectedArea, sortBy]);

  // Handle area filter change
  const handleAreaFilterChange = (e) => {
    setSelectedArea(e.target.value);
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
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
    if (!orderInfo) return 'bg-yellow-200 dark:bg-yellow-200 dark:text-black';
    
    if (orderInfo.hasOrder && orderInfo.status !== 'completed') {
      return 'bg-red-200 dark:bg-red-200 dark:text-black';
    }
    return 'bg-yellow-200 dark:bg-yellow-200 dark:text-black';
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
      {/* Payment Modal */}
      <Modal show={showPaymentModal} size='sm' onClose={() => setShowPaymentModal(false)}>
        <Modal.Header>
          {paymentStatus === 'success' ? 'Payment Successful' : 'Payment Error'}
        </Modal.Header>
        <Modal.Body>
          <div className={`text-center p-4 ${paymentStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            <p className="text-lg font-semibold">{paymentMessage}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            color={paymentStatus === 'success' ? 'success' : 'failure'} 
            onClick={() => setShowPaymentModal(false)}
            className="w-full"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Type Modal */}
      <Modal show={showPaymentTypeModal} size="md" onClose={() => setShowPaymentTypeModal(false)}>
        <Modal.Header>Select Payment Method</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <Select 
              id="paymentType" 
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full"
            >
              <option value="CASH">Cash</option>
              <option value="VISA">Visa</option>
              <option value="MASTER">MasterCard</option>
              <option value="EWALLET-TNG">Touch 'n Go eWallet</option>
              <option value="DUITNOW">DuitNow</option>
              <option value="BANK-TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </Select>
            
            <div className="flex justify-end gap-2">
              <Button color="gray" onClick={() => setShowPaymentTypeModal(false)}>
                Cancel
              </Button>
              <Button 
                color="success" 
                onClick={handleSubmitPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <div className='flex flex-col md:flex-row items-center justify-between mb-4 gap-4'>
        <h1 className='text-2xl font-semibold text-gray-700'>Open Tables</h1>
        
        <div className='flex flex-col md:flex-row gap-2 w-full md:w-auto'>
          <Select 
            id="areaFilter" 
            onChange={handleAreaFilterChange} 
            value={selectedArea}
            className='w-full md:w-48'
          >
            <option value="">All Areas</option>
            {areas.map((area) => (
              <option key={area._id} value={area._id}>
                {area.areaname}
              </option>
            ))}
          </Select>
          
          <Select 
            id="sortFilter" 
            onChange={handleSortChange} 
            value={sortBy}
            className='w-full md:w-48'
          >
            <option value="default">Default Sorting</option>
            <option value="hasOrder">With Orders First</option>
            <option value="noOrder">Without Orders First</option>
          </Select>
        </div>
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
                      {orderInfo.paymentType && (
                        <p className="text-xs">Paid with: {orderInfo.paymentType}</p>
                      )}
                    </>
                  )}
                  
                  <p>Customer: {table.open?.customername || '-'}</p>
                  <p>Phone: {table.open?.phonenumber || '-'}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Badge
                    color="failure" 
                    size="xs"
                    className={`cursor-pointer ${isTableCloseDisabled(table._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={isTableCloseDisabled(table._id) ? undefined : () => handleCloseTable(table._id)}
                    disabled={isProcessing || isTableCloseDisabled(table._id)}
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
                      Check Payment
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