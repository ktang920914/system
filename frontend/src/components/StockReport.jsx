import { Button, Pagination, Table, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const StockReport = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/product/get-products');
      const data = await res.json();
      if (res.ok) {
        const singleProducts = data.filter(product => product.productcategory === 'Single');
        setProducts(singleProducts);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/order/get-orders');
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const calculateAvailableStock = (product) => {
    let soldQuantity = 0;
    
    orders.forEach(order => {
      order.orderitems.forEach(item => {
        if (item.orderproductname === product.productname) {
          soldQuantity += item.orderproductquantity;
        }
      });
      
      order.ordercomboitem.forEach(combo => {
        combo.combochooseitems.forEach(chooseItem => {
          if (chooseItem.combochooseitemname === product.productname) {
            soldQuantity += chooseItem.combochooseitemquantity;
          }
        });
      });
    });
    
    return product.productquantity - soldQuantity;
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = products
      .filter(product => product.productname.toLowerCase().includes(term))
      .map(product => ({
        ...product,
        availableQuantity: calculateAvailableStock(product)
      }));
      
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (products.length > 0 && orders.length > 0) {
      const productsWithAvailableStock = products.map(product => ({
        ...product,
        availableQuantity: calculateAvailableStock(product)
      }));
      
      const filtered = searchTerm 
        ? productsWithAvailableStock.filter(product => 
            product.productname.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : productsWithAvailableStock;
        
      setFilteredProducts(filtered);
    }
  }, [products, orders, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const getPaginationData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const generateExcelReport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredProducts.map(p => ({
      'Product Name': p.productname,
      'Initial Quantity': p.productquantity,
      'Available Quantity': p.availableQuantity
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');
    XLSX.writeFile(workbook, 'StockQTYReport.xlsx');
  };

  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-gray-500'>Stock Report</h1>
        <Button onClick={generateExcelReport}>Export Report</Button>
      </div>

      <TextInput
        type="text"
        placeholder="Search by product name"
        value={searchTerm}
        onChange={handleSearch}
        className="mt-4"
      />

      <Table hoverable className='shadow-md mt-4'>
        <Table.Head>
          <Table.HeadCell>Product Name</Table.HeadCell>
          <Table.HeadCell>Initial Quantity</Table.HeadCell>
          <Table.HeadCell>Available Quantity</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {getPaginationData().map((product) => (
            <Table.Row key={product._id}>
              <Table.Cell>{product.productname}</Table.Cell>
              <Table.Cell>{product.productquantity}</Table.Cell>
              <Table.Cell>{product.availableQuantity}</Table.Cell>
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
    </div>
  );
};

export default StockReport;