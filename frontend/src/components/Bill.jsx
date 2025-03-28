import React, { useState, useEffect } from 'react';
import { Badge, Button, Label, Modal, Pagination, Select, Table } from 'flowbite-react';
import * as XLSX from 'xlsx';

const Bill = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
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
    
    // Add regular order items
    if (order.orderitems && order.orderitems.length > 0) {
      products = order.orderitems.map((item) => ({
        name: item.orderproductname,
        quantity: item.orderproductquantity,
        price: (item.orderproductprice * item.orderproductquantity).toFixed(2),
        isCombo: false,
        isChooseItem: false
      }));
    }
    
    // Add combo items
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
              price: '', // Choose items usually don't have separate prices
              isCombo: true,
              isChooseItem: true
            });
          });
        }
      });
    }
    
    return products;
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
      // Prepare the updated order
      const updatedOrder = { ...selectedOrder };
      
      // Filter out refunded regular items
      if (updatedOrder.orderitems) {
        updatedOrder.orderitems = updatedOrder.orderitems.filter((_, index) => 
          !selectedItems.includes(`item-${index}`)
        );
      }
      
      // Filter out refunded combo items and their choose items
      if (updatedOrder.ordercomboitem) {
        updatedOrder.ordercomboitem = updatedOrder.ordercomboitem
          .map((combo, index) => {
            if (selectedItems.includes(`combo-${index}`)) {
              // Skip the entire combo if selected
              return null;
            }
            
            // Filter choose items if they're selected
            if (combo.combochooseitems) {
              combo.combochooseitems = combo.combochooseitems.filter((_, chooseIndex) => 
                !selectedItems.includes(`combo-${index}-choose-${chooseIndex}`)
              );
            }
            
            return combo;
          })
          .filter(combo => combo !== null);
      }
      
      // Recalculate totals
      let subtotal = 0;
      let taxtotal = 0;

      // Calculate for regular items
      updatedOrder.orderitems?.forEach(item => {
        const itemTotal = item.orderproductprice * item.orderproductquantity;
        subtotal += itemTotal;
        taxtotal += itemTotal * (item.orderproducttax / 100);
      });

      // Calculate for combo items
      updatedOrder.ordercomboitem?.forEach(combo => {
        const comboTotal = combo.comboproductprice * combo.comboproductquantity;
        subtotal += comboTotal;
        taxtotal += comboTotal * (combo.comboproducttax / 100);
      });

      updatedOrder.subtotal = subtotal;
      updatedOrder.taxtotal = taxtotal;
      updatedOrder.ordertotal = subtotal + taxtotal;

      // Send the update to the server
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
        // Update the local state
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
            
            {/* Regular items */}
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
            
            {/* Combo items - simplified version without choose items selection */}
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
                
                {/* Combo choose items - display only without checkbox */}
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

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  const getPaginationData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return orders.slice(startIndex, endIndex);
  };

  const generateExcelReport = () => {
    // Create an array where each product gets its own row
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
      
      // If no products, return just the order info
      if (products.length === 0) return [baseData];
      
      // Create one row per product
      return products.map((product, index) => ({
        ...baseData,
        'Product Name': (product.isChooseItem ? '  - ' : '') + product.name,
        'Quantity': product.quantity,
        'Price (RM)': product.price || '0.00',
        // Only show order info in the first row for each order
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
  
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    
    // Set column widths (optional)
    ws['!cols'] = [
      { width: 15 }, // Order Number
      { width: 10 }, // Table
      { width: 25 }, // Product Name
      { width: 10 }, // Quantity
      { width: 12 }, // Price
      { width: 12 }, // Subtotal
      { width: 10 }, // Tax
      { width: 12 }, // Total
      { width: 15 }, // Payment Type
      { width: 12 }, // Status
      { width: 20 }  // Date
    ];
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Bills Report");
    
    // Generate the Excel file and trigger download
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Bills_Report_${date}.xlsx`);
  };

  return (
    <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
      {renderRefundModal()}
      
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl text-gray-500 font-semibold'>Bills</h1>
        <Button onClick={generateExcelReport}>Report</Button>
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
          {getPaginationData().map((order) => (
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
                      <span className="flex-1">
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
              <Table.Cell className='flex flex-col gap-2'>
                <Button color='warning' onClick={() => handleRefundClick(order)}>
                  Refund
                </Button>
                <Button color='success'>
                  Print
                </Button>
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
          showIcons
        />
      </div>
    </div>
  );
};

export default Bill;