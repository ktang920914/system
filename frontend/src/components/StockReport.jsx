import { Button, Pagination, Table, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const StockReport = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/product/get-products');
      const data = await res.json();
      if (res.ok) {
        // Filter products to only include those with productcategory 'Single'
        const singleProducts = data.filter(product => product.productcategory === 'Single');
        setProducts(singleProducts);
        setFilteredProducts(singleProducts);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = products.filter(product => 
      product.productname.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page on new search
  };

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const getPaginationData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const generateExcelReport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredProducts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');
    XLSX.writeFile(workbook, 'StockQTYReport.xlsx');
  };

  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-gray-500'>Reports</h1>
        <Button onClick={generateExcelReport}>Report</Button>
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
          <Table.HeadCell>Quantity</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {getPaginationData().map((product) => (
            <Table.Row key={product._id}>
              <Table.Cell>{product.productname}</Table.Cell>
              <Table.Cell>{product.productquantity}</Table.Cell>
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