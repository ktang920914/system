import { Alert, Button, Label, Modal, Select, Table, TextInput } from 'flowbite-react';
import React, { useState, useEffect } from 'react';

const Product = () => {
    const [formData, setFormData] = useState({});
    const [openProductModal, setOpenProductModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [products, setProducts] = useState([]);
    const [openSubModal, setOpenSubModal] = useState(false);
    const [subCategories, setSubCategories] = useState([]);

    // Fetch sub categories and products on component load
    useEffect(() => {
        const fetchSubCategories = async () => {
            try {
                const res = await fetch('/api/product/get-sub-categories');
                const data = await res.json();
                if (res.ok) {
                    setSubCategories(data);
                }
            } catch (error) {
                console.error(error);
            }
        };

        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/product/get-products');
                const data = await res.json();
                if (res.ok) {
                    setProducts(data);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchSubCategories(); // Fetch sub categories
        fetchProducts(); // Fetch products
    }, []);

    // Handle form input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
    };

    // Toggle product modal
    const handleProductModal = () => {
        setOpenProductModal(!openProductModal);
        setErrorMessage(null);
    };

    // Toggle sub category modal
    const handleSubModal = () => {
        setOpenSubModal(!openSubModal);
        setErrorMessage(null);
    };

    // Handle product form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/product/create-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                // Find the subcategory name from the subCategories state
                const subCategory = subCategories.find(sub => sub._id === formData.productsub);
                data.productsub = subCategory; // Attach the subcategory object to the product
                setProducts(prev => [...prev, data]); // Add new product to the list
                setOpenProductModal(false); // Close modal
                setErrorMessage(null); // Clear error message
            } else {
                setErrorMessage(data.message); // Show error message
            }
        } catch (error) {
            setErrorMessage(error.message); // Show error message
        }
    };

    // Handle sub category form submission
    const handleSubCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/product/create-sub-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setErrorMessage(null); // Clear error message
                setOpenSubModal(false); // Close modal
                setSubCategories(prev => [...prev, data]); // Add new sub category to the list
            } else {
                setErrorMessage(data.message); // Show error message
            }
        } catch (error) {
            setErrorMessage(error.message); // Show error message
        }
    };

    return (
        <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold text-gray-500'>Products</h1>
                <div className='flex items-center gap-2'>
                    <Button onClick={handleProductModal}>Create product</Button>
                    <Button onClick={handleSubModal}>Create sub category</Button>
                </div>
            </div>

            {/* Products Table */}
            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell>Sub Category</Table.HeadCell>
                    <Table.HeadCell>Product Category</Table.HeadCell>
                    <Table.HeadCell>Product Name</Table.HeadCell>
                    <Table.HeadCell>Product Image</Table.HeadCell>
                    <Table.HeadCell>Price</Table.HeadCell>
                    <Table.HeadCell>Tax</Table.HeadCell>
                    <Table.HeadCell>Delete</Table.HeadCell>
                    <Table.HeadCell><span>Edit</span></Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {products.map((product) => (
                        <Table.Row key={product._id}>
                            <Table.Cell>
                                {product.productsub ? product.productsub.name : 'N/A'} {/* Display sub category name */}
                            </Table.Cell>
                            <Table.Cell>{product.productcategory}</Table.Cell>
                            <Table.Cell>{product.productname}</Table.Cell>
                            <Table.Cell>{product.productimage}</Table.Cell>
                            <Table.Cell>RM{product.productprice}</Table.Cell>
                            <Table.Cell>{product.producttax}%</Table.Cell>
                            <Table.Cell>
                                <Button color="failure">Delete</Button>
                            </Table.Cell>
                            <Table.Cell>
                                <Button color="warning">Edit</Button>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            {/* Create Product Modal */}
            <Modal show={openProductModal} size="xl" popup onClose={handleProductModal}>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className="text-2xl text-gray-500 font-semibold">Create Product</h1>
                        {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                        <form onSubmit={handleSubmit}>
                            <div className='mt-4'>
                                <Label value='Product Category' />
                                <Select id="productcategory" onChange={handleChange} required>
                                    <option value=''>Please select</option>
                                    <option value='Single'>Single</option>
                                    <option value='Combo'>Combo</option>
                                </Select>
                            </div>
                            <div className='mt-4'>
                                <Label value='Sub Category' />
                                <Select id="productsub" onChange={handleChange} required>
                                    <option value=''>Please select sub category</option>
                                    {subCategories.map((subCategory) => (
                                        <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className='mt-4'>
                                <Label value='Product Name' />
                                <TextInput type='text' id='productname' placeholder='Enter Product Name'
                                    onChange={handleChange} required />
                            </div>
                            <div className='mt-4'>
                                <Label value='Product Price (RM)' />
                                <TextInput type='number' id='productprice' placeholder='Enter Product Price'
                                    onChange={handleChange} required />
                            </div>
                            <div className='mt-4 mb-4'>
                                <Label value='Product Tax %' />
                                <TextInput type='number' id='producttax' placeholder='Enter Product Tax'
                                    onChange={handleChange} required />
                            </div>
                            <Button type='submit'>Submit</Button>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Create Sub Category Modal */}
            <Modal show={openSubModal} size="md" popup onClose={handleSubModal}>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className="text-2xl text-gray-500 font-semibold">Create Sub Category</h1>
                        {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                        <form onSubmit={handleSubCategorySubmit}>
                            <div className='mt-4 mb-4'>
                                <Label value='Sub Category Name' />
                                <TextInput type='text' id='name' placeholder='Enter Sub Category Name'
                                    onChange={handleChange} required />
                            </div>
                            <Button type='submit'>Submit</Button>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Product;