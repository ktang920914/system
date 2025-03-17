import { Alert, Button, Label, Modal, Pagination, Select, Table, TextInput } from 'flowbite-react';
import React, { useState, useEffect } from 'react';

const Product = () => {
    const [formData, setFormData] = useState({});
    const [openProductModal, setOpenProductModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [products, setProducts] = useState([]);
    const [openSubModal, setOpenSubModal] = useState(false);
    const [subCategories, setSubCategories] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [openEditModal, setOpenEditModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

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

        fetchSubCategories();
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
    };

    const handleProductModal = () => {
        setOpenProductModal(!openProductModal);
        setErrorMessage(null);
    };

    const handleSubModal = () => {
        setOpenSubModal(!openSubModal);
        setErrorMessage(null);
    };

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
                const subCategory = subCategories.find(sub => sub._id === formData.productsub);
                data.productsub = subCategory;

                // 将新产品添加到 products 数组的开头
                setProducts(prev => [data, ...prev]);

                // 重置分页到第一页
                setCurrentPage(1);

                // 关闭模态框并清空错误消息
                setOpenProductModal(false);
                setErrorMessage(null);
            } else {
                setErrorMessage(data.message);
            }
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

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
                setErrorMessage(null);
                setOpenSubModal(false);
                setSubCategories(prev => [...prev, data]);
            } else {
                setErrorMessage(data.message);
            }
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const sortedProducts = React.useMemo(() => {
        let sortableProducts = [...products];
        if (sortConfig.key !== null) {
            sortableProducts.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        } else {
            // 默认按创建时间降序排列（新产品在前）
            sortableProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return sortableProducts;
    }, [products, sortConfig]);

    const filteredProducts = React.useMemo(() => {
        return sortedProducts.filter(product => {
            // 将价格和税率转换为字符串，以便进行关键字匹配
            const priceString = product.productprice.toString();
            const taxString = product.producttax.toString();

            // 匹配名称、类别、子类别、价格和税率
            const matchesName = product.productname.toLowerCase().includes(searchQuery);
            const matchesCategory = product.productcategory.toLowerCase().includes(searchQuery);
            const matchesSubCategory = product.productsub ? product.productsub.name.toLowerCase().includes(searchQuery) : false;
            const matchesPrice = priceString.includes(searchQuery); // 匹配价格
            const matchesTax = taxString.includes(searchQuery); // 匹配税率

            // 综合条件
            return matchesName || matchesCategory || matchesSubCategory || matchesPrice || matchesTax;
        });
    }, [sortedProducts, searchQuery]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value.trim().toLowerCase());
        setCurrentPage(1); // 重置分页到第一页
    };

    const handleDelete = async (productId) => {
        try {
            const res = await fetch(`/api/product/delete-product/${productId}`,{
              method: 'DELETE',
            })
            const data = await res.json()
            if(res.ok){
              setProducts((prevProducts) => prevProducts.filter((product) => product._id !== productId))
            }else{
              console.log(data.message)
            }
          } catch (error) {
            console.log(error.message)
          }
    }

    const handleEditModal = () => {
        setOpenEditModal(!openEditModal)
        setErrorMessage(null)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    const getPaginationData = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, endIndex);
    };

    return (
        <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold text-gray-500'>Products</h1>
                <TextInput 
                    type='text' 
                    placeholder='Search' 
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
                <div className='flex items-center gap-2'>
                    <Button onClick={handleProductModal}>Create product</Button>
                    <Button onClick={handleSubModal}>Create Subcategory</Button>
                </div>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell onClick={() => requestSort('productcategory')}>
                        Category {sortConfig.key === 'productcategory' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </Table.HeadCell>
                    <Table.HeadCell onClick={() => requestSort('productsub')}>
                        Sub Category {sortConfig.key === 'productsub' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </Table.HeadCell>
                    <Table.HeadCell onClick={() => requestSort('productname')}>
                        Name {sortConfig.key === 'productname' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </Table.HeadCell>
                    <Table.HeadCell>Image</Table.HeadCell>
                    <Table.HeadCell onClick={() => requestSort('productprice')}>
                        Price {sortConfig.key === 'productprice' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </Table.HeadCell>
                    <Table.HeadCell onClick={() => requestSort('producttax')}>
                        Tax {sortConfig.key === 'producttax' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </Table.HeadCell>
                    <Table.HeadCell>Delete</Table.HeadCell>
                    <Table.HeadCell><span>Edit</span></Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {getPaginationData().map((product) => (
                        <Table.Row key={product._id}>
                            <Table.Cell>{product.productcategory}</Table.Cell>
                            <Table.Cell>
                                {product.productsub ? product.productsub.name : 'N/A'}
                            </Table.Cell>
                            <Table.Cell>{product.productname}</Table.Cell>
                            <Table.Cell>
                                <img 
                                    src={product.productimage || 'https://static.thenounproject.com/png/3850446-200.png'} 
                                    alt={product.productname} 
                                    className="w-16 h-16 object-cover" 
                                />
                            </Table.Cell>
                            <Table.Cell>RM{product.productprice}</Table.Cell>
                            <Table.Cell>{product.producttax}%</Table.Cell>
                            <Table.Cell>
                                <Button color="failure" onClick={() => {handleDelete(product._id)}}>Delete</Button>
                            </Table.Cell>
                            <Table.Cell>
                                <Button color="warning"onClick={() => {handleEditModal()}}>Edit</Button>
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

            <Modal show={openSubModal} size="md" popup onClose={handleSubModal}>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className="text-2xl text-gray-500 font-semibold">Create Subcategory</h1>
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

            <Modal show={openEditModal} size="xl" popup onClose={handleEditModal}>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className="text-2xl text-gray-500 font-semibold">Update product</h1>
                        {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                        <form onSubmit={handleEditSubmit}>
                        <input hidden type='file' accept='image/*' id='productimage'/>
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
        </div>
    );
};

export default Product;