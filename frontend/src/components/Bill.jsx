import React, { useState, useEffect } from 'react';
import { Badge, Button, Label, Modal, Pagination, Select, Table, TextInput } from 'flowbite-react';
import * as XLSX from 'xlsx';

const Bill = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/order/get-orders');
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchOrders();
  }, []);

  const formatProducts = (order) => {
    let products = [];
    
    if (order.orderitems && order.orderitems.length > 0) {
      products = order.orderitems.map((item) => ({
        name: item.orderproductname,
        quantity: item.orderproductquantity,
        price: (item.orderproductprice * item.orderproductquantity).toFixed(2),
        isCombo: false,
        isChooseItem: false
      }));
    }
    
    if (order.ordercomboitem && order.ordercomboitem.length > 0) {
      order.ordercomboitem.forEach((combo) => {
        products.push({
          name: combo.comboproductitem,
          quantity: combo.comboproductquantity,
          price: (combo.comboproductprice * combo.comboproductquantity).toFixed(2),
          isCombo: true,
          isChooseItem: false
        });
        
        if (combo.combochooseitems && combo.combochooseitems.length > 0) {
          combo.combochooseitems.forEach((chooseItem) => {
            products.push({
              name: chooseItem.combochooseitemname,
              quantity: chooseItem.combochooseitemquantity,
              price: '',
              isCombo: true,
              isChooseItem: true
            });
          });
        }
      });
    }
    
    return products;
  };

  const getFilteredOrders = () => {
    return orders.filter(order => {
      if (!searchTerm) return true;
      
      // Basic fields search
      const tableName = order.table?.tablename || '';
      const orderNumber = order.ordernumber || '';
      const paymentType = order.paymentType || '';
      const status = order.status || '';
      
      // Check basic fields first
      const basicMatch = 
        tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paymentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        status.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (basicMatch) return true;

      // Check product names if basic fields don't match
      const products = formatProducts(order);
      return products.some(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const handleRefundClick = (order) => {
    setSelectedOrder(order);
    setSelectedItems([]);
    setShowRefundModal(true);
  };

  const handleItemSelect = (type, index, isCombo = false, chooseIndex = null) => {
    const itemKey = isCombo 
      ? (chooseIndex !== null ? `combo-${index}-choose-${chooseIndex}` : `combo-${index}`)
      : `item-${index}`;

    setSelectedItems(prev => {
      if (prev.includes(itemKey)) {
        return prev.filter(item => item !== itemKey);
      } else {
        return [...prev, itemKey];
      }
    });
  };

  const processRefund = async () => {
    if (!selectedOrder || selectedItems.length === 0) return;

    try {
      const updatedOrder = { ...selectedOrder };
      
      if (updatedOrder.orderitems) {
        updatedOrder.orderitems = updatedOrder.orderitems.filter((_, index) => 
          !selectedItems.includes(`item-${index}`)
        );
      }
      
      if (updatedOrder.ordercomboitem) {
        updatedOrder.ordercomboitem = updatedOrder.ordercomboitem
          .map((combo, index) => {
            if (selectedItems.includes(`combo-${index}`)) {
              return null;
            }
            
            if (combo.combochooseitems) {
              combo.combochooseitems = combo.combochooseitems.filter((_, chooseIndex) => 
                !selectedItems.includes(`combo-${index}-choose-${chooseIndex}`)
              );
            }
            
            return combo;
          })
          .filter(combo => combo !== null);
      }
      
      let subtotal = 0;
      let taxtotal = 0;

      updatedOrder.orderitems?.forEach(item => {
        const itemTotal = item.orderproductprice * item.orderproductquantity;
        subtotal += itemTotal;
        taxtotal += itemTotal * (item.orderproducttax / 100);
      });

      updatedOrder.ordercomboitem?.forEach(combo => {
        const comboTotal = combo.comboproductprice * combo.comboproductquantity;
        subtotal += comboTotal;
        taxtotal += comboTotal * (combo.comboproducttax / 100);
      });

      updatedOrder.subtotal = subtotal;
      updatedOrder.taxtotal = taxtotal;
      updatedOrder.ordertotal = subtotal + taxtotal;

      const res = await fetch(`/api/order/update-order/${selectedOrder.ordernumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderitems: updatedOrder.orderitems,
          ordercomboitem: updatedOrder.ordercomboitem,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(order => 
          order._id === selectedOrder._id ? data.order : order
        ));
        setShowRefundModal(false);
      } else {
        console.error('Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const renderRefundModal = () => {
    if (!selectedOrder) return null;
  
    return (
      <Modal show={showRefundModal} onClose={() => setShowRefundModal(false)}>
        <Modal.Header>Refund Items</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <h3 className="font-semibold">Select items to refund:</h3>
            
            {selectedOrder.orderitems?.map((item, index) => (
              <div key={`item-${index}`} className="flex items-center">
                <input
                  type="checkbox"
                  id={`item-${index}`}
                  checked={selectedItems.includes(`item-${index}`)}
                  onChange={() => handleItemSelect('item', index)}
                  className="mr-2"
                />
                <label htmlFor={`item-${index}`}>
                  {item.orderproductname} x {item.orderproductquantity} - 
                  RM {(item.orderproductprice * item.orderproductquantity).toFixed(2)}
                </label>
              </div>
            ))}
            
            {selectedOrder.ordercomboitem?.map((combo, comboIndex) => (
              <div key={`combo-${comboIndex}`} className="ml-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`combo-${comboIndex}`}
                    checked={selectedItems.includes(`combo-${comboIndex}`)}
                    onChange={() => handleItemSelect('combo', comboIndex, true)}
                    className="mr-2"
                  />
                  <label htmlFor={`combo-${comboIndex}`}>
                    {combo.comboproductitem} x {combo.comboproductquantity} - 
                    RM {(combo.comboproductprice * combo.comboproductquantity).toFixed(2)}
                  </label>
                </div>
                
                {combo.combochooseitems?.map((chooseItem, chooseIndex) => (
                  <div key={`choose-${chooseIndex}`} className="ml-6">
                    <span className="text-gray-600">
                      - {chooseItem.combochooseitemname} x {chooseItem.combochooseitemquantity}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={processRefund} disabled={selectedItems.length === 0}>
            Process Refund
          </Button>
          <Button color="gray" onClick={() => setShowRefundModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const generateExcelReport = () => {
    const reportData = orders.flatMap(order => {
      const baseData = {
        'Order Number': order.ordernumber,
        'Table': order.table?.tablename || 'N/A',
        'Subtotal (RM)': order.subtotal?.toFixed(2),
        'Tax (RM)': order.taxtotal?.toFixed(2),
        'Total (RM)': order.ordertotal?.toFixed(2),
        'Payment Type': order.paymentType || 'N/A',
        'Status': order.status,
        'Date': new Date(order.createdAt).toLocaleString()
      };
  
      const products = formatProducts(order);
      
      if (products.length === 0) return [baseData];
      
      return products.map((product, index) => ({
        ...baseData,
        'Product Name': (product.isChooseItem ? '  - ' : '') + product.name,
        'Quantity': product.quantity,
        'Price (RM)': product.price || '0.00',
        ...(index > 0 ? {
          'Order Number': '',
          'Table': '',
          'Subtotal (RM)': '',
          'Tax (RM)': '',
          'Total (RM)': '',
          'Payment Type': '',
          'Status': '',
          'Date': ''
        } : {})
      }));
    });
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    
    ws['!cols'] = [
      { width: 15 },
      { width: 10 },
      { width: 25 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 10 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 20 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, "Bills Report");
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Bills_Report_${date}.xlsx`);
  };

  const filteredOrders = getFilteredOrders();
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  return (
    <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
      {renderRefundModal()}
      
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl text-gray-500 font-semibold'>Bills</h1>
        <div className='flex items-center gap-2'>
          <TextInput 
            type='text' 
            placeholder='Search'
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value.toLowerCase();
              setSearchTerm(value);
              setCurrentPage(1);
            }}
          />
          <Button onClick={generateExcelReport}>Report</Button>
        </div>
      </div>

      <Table hoverable className='shadow-md mt-4'>
        <Table.Head>
          <Table.HeadCell>Order Number</Table.HeadCell>
          <Table.HeadCell>Products</Table.HeadCell>
          <Table.HeadCell>Subtotal (RM)</Table.HeadCell>
          <Table.HeadCell>Tax (RM)</Table.HeadCell>
          <Table.HeadCell>Total (RM)</Table.HeadCell>
          <Table.HeadCell>Payment Type</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell>Action</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {paginatedOrders.map((order) => (
            <Table.Row key={order._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
              <Table.Cell className='whitespace-nowrap'>
                <div className='text-center'>{order.table?.tablename || 'N/A'}</div> {order.ordernumber}
              </Table.Cell>
              <Table.Cell>
                <div className="space-y-1">
                  {formatProducts(order).map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex ${item.isChooseItem ? 'ml-4 text-sm text-gray-600' : ''}`}
                    >
                      <span className="flex-1 dark:text-gray-200">
                        {item.isChooseItem && '- '}
                        {item.name} × {item.quantity}
                      </span>
                      {item.price && (
                        <span className="ml-2 font-medium">
                          RM {item.price}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Table.Cell>
              <Table.Cell>
                {order.subtotal?.toFixed(2)}
              </Table.Cell>
              <Table.Cell>
                {order.taxtotal?.toFixed(2)}
              </Table.Cell>
              <Table.Cell>
                {order.ordertotal?.toFixed(2)}
              </Table.Cell>
              <Table.Cell>
                {order.paymentType || 'N/A'}
              </Table.Cell>
              <Table.Cell>
                <Badge color={order.status === 'completed' ? 'success' : 'warning'}>
                  {order.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div className='flex flex-col gap-2'>
                  <Button color='warning' onClick={() => handleRefundClick(order)}>
                    Refund
                  </Button>
                  <Button color='success'>
                    Print
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {filteredOrders.length > 0 ? (
        <div className='flex justify-center mt-4'>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            showIcons
          />
        </div>
      ) : (
        <div className='text-center py-8 text-gray-500'>
          {searchTerm ? 'No matching orders found' : 'No orders available'}
        </div>
      )}
    </div>
  );
};

export default Bill;