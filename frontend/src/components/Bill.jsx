import React, { useState, useEffect } from 'react';
import { Badge, Button, Label, Modal, Pagination, Select, Table } from 'flowbite-react';

const Bill = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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
      products = order.orderitems.map(item => (
        `${item.orderproductname} x ${item.orderproductquantity}`
      ));
    }
    
    // Add combo items
    if (order.ordercomboitem && order.ordercomboitem.length > 0) {
      order.ordercomboitem.forEach(combo => {
        products.push(`${combo.comboproductitem} x ${combo.comboproductquantity}`);
        
        if (combo.combochooseitems && combo.combochooseitems.length > 0) {
          combo.combochooseitems.forEach(chooseItem => {
            products.push(`  - ${chooseItem.combochooseitemname} x ${chooseItem.combochooseitemquantity}`);
          });
        }
      });
    }
    
    return products.join('\n');
  }

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  const getPaginationData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return orders.slice(startIndex, endIndex);
  };

  return (
    <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl text-gray-500 font-semibold'>Bills</h1>
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
        </Table.Head>
        <Table.Body className="divide-y">
          {getPaginationData().map((order) => (
            <Table.Row key={order._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
              <Table.Cell className='whitespace-nowrap'>
                {order.ordernumber}
              </Table.Cell>
              <Table.Cell className="whitespace-pre-line">
                {formatProducts(order)}
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