import { Button, Label, Modal, Pagination, Select, Table, TextInput } from 'flowbite-react'
import React, { useState, useEffect } from 'react'

const Bill = () => {
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({})
  const [openPaymentModal, setOpenPaymentModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/order/get-orders');
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders);
        } else {
          setErrorMessage(data.message || 'Failed to fetch orders');
        }
      } catch (error) {
        setErrorMessage(error.message);
      }
    };
    fetchOrders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Payment submission logic here
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  const handlePaymentModal = (order) => {
    setSelectedOrder(order);
    setOpenPaymentModal(!openPaymentModal)
  }

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
    <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar
   scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
    <div className='flex items-center justify-between'>
        <h1 className='text-2xl text-gray-500 font-semibold'>Bills</h1>
    </div>

    <Table hoverable className='shadow-md mt-4'>
      <Table.Head>
          <Table.HeadCell>Order Number</Table.HeadCell>
          <Table.HeadCell>Products</Table.HeadCell>
          <Table.HeadCell>Subtotal</Table.HeadCell>
          <Table.HeadCell>Tax Total</Table.HeadCell>
          <Table.HeadCell>Total</Table.HeadCell>
          <Table.HeadCell>Payment</Table.HeadCell>
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
              <Button onClick={() => handlePaymentModal(order)}>
                Payment
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
      />
    </div>

    <Modal show={openPaymentModal} size="md" popup onClose={() => setOpenPaymentModal(false)}>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-2">
          <h1 className="text-2xl text-gray-500 font-semibold">Make payment for {selectedOrder?.ordernumber}</h1>
          <p className="text-lg">Total: RM {selectedOrder?.ordertotal?.toFixed(2)}</p>
              {
                  errorMessage && (
                      <Alert color='failure'>
                          {errorMessage}
                      </Alert>
                  )
              }
              <form onSubmit={handleSubmit}>
                  <div className='mt-4 mb-4'>
                      <Label value='Payment Type'/>
                      <Select id="paymenttype" onChange={handleChange} required>
                          <option value='Uncategory'>Select category</option>
                          <option value='CASH'>CASH</option>
                          <option value='VISA'>VISA</option>
                          <option value='MASTER'>MASTER</option>
                          <option value='EWALLET-TNG'>EWALLET-TNG</option>
                          <option value='DUITNOW'>DUITNOW</option>
                          <option value='BANK-TRANSFER'>BANK-TRANSFER</option>
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

export default Bill