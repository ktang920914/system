import { Button, Pagination, Select, Table } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

const ProductPrinter = () => {
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [subcategories, setSubCategories] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7); // Number of items per page

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subcategories
        const subCatRes = await fetch('/api/product/get-sub-categories');
        const subCatData = await subCatRes.json();
        if (subCatRes.ok) {
          setSubCategories(subCatData);
        }

        // Fetch printers
        const printerRes = await fetch('/api/printer/get-printers');
        const printerData = await printerRes.json();
        if (printerRes.ok) {
          setPrinters(printerData);
        }

        // Fetch products
        const productRes = await fetch('/api/product/get-products');
        const productData = await productRes.json();
        if (productRes.ok) {
          setProducts(productData);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const handleSubCategoryFilterChange = (e) => {
    setSelectedSubCategory(e.target.value);
    setCurrentPage(1);
  };

  const handlePrinterFilterChange = (e) => {
    setSelectedPrinter(e.target.value);
    setCurrentPage(1);
  };

  // Filter products based on selected subcategory and printer
  const filteredProducts = products.filter((product) => {
    return (
      (selectedSubCategory === '' || product.productsub._id === selectedSubCategory) &&
      (selectedPrinter === '' || product.productprinter === selectedPrinter)
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-gray-500'>Product Printer</h1>
        <div className='flex gap-4'>
          <Select id='subcategoryFilter' onChange={handleSubCategoryFilterChange} value={selectedSubCategory}>
            <option value=''>All Sub Category</option>
            {subcategories.map((subCategory) => (
              <option key={subCategory._id} value={subCategory._id}>
                {subCategory.name}
              </option>
            ))}
          </Select>
          <Select id='printerFilter' onChange={handlePrinterFilterChange} value={selectedPrinter}>
            <option value=''>All Printers</option>
            {printers.map((printer) => (
              <option key={printer._id} value={printer.printername}>
                {printer.printername}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Table hoverable className='shadow-md mt-4'>
        <Table.Head>
          <Table.HeadCell>Product</Table.HeadCell>
          <Table.HeadCell>Sub Category</Table.HeadCell>
          <Table.HeadCell>Printer</Table.HeadCell>
          <Table.HeadCell>Pair</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {currentItems.map((product) => (
            <Table.Row key={product._id}>
              <Table.Cell>{product.productname}</Table.Cell>
              <Table.Cell>{product.productsub.name}</Table.Cell>
              <Table.Cell>
                <Select defaultValue={product.productprinter}>
                  <option value=''>Select Printer</option>
                  {printers.map((printer) => (
                    <option key={printer._id} value={printer.printername}>
                      {printer.printername}
                    </option>
                  ))}
                </Select>
              </Table.Cell>
              <Table.Cell>
                <Button color='warning'>Pair</Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <div className='flex justify-center mt-4'>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
          onPageChange={paginate}
          className='mt-4'
        />
      </div>
    </div>
  );
};

export default ProductPrinter;