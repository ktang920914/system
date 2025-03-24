import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, TextInput, Select, Alert, Label, Pagination } from 'flowbite-react';

const Combo = () => {
    const [combos, setCombos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [comboName, setComboName] = useState('');
    const [option, setOption] = useState(1);
    const [chooseNumber, setChooseNumber] = useState(1);
    const [productDetails, setProductDetails] = useState([{ productname: '', comboquantity: '' }]);
    const [comboProducts, setComboProducts] = useState([]);
    const [singleProducts, setSingleProducts] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCombo, setEditingCombo] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    useEffect(() => {
        fetchCombos();
        fetchComboProducts();
    }, []);

    const fetchCombos = async () => {
        try {
            const res = await fetch('/api/combo/get-combos');
            const data = await res.json();
            if (res.ok) {
                setCombos(data);
            } else {
                console.log(data.message);
            }
        } catch (error) {
            console.error('Error fetching combos:', error);
        }
    };

    const fetchComboProducts = async () => {
        try {
            const res = await fetch('/api/product/get-products');
            const data = await res.json();
            const comboProducts = data.filter(product => product.productcategory === 'Combo');
            const singleProducts = data.filter(product => product.productcategory === 'Single');
            setComboProducts(comboProducts);
            setSingleProducts(singleProducts);
        } catch (error) {
            console.error('Error fetching combo products:', error);
        }
    };

    const handleCreateCombo = async () => {
        if (chooseNumber > option) {
            setErrorMessage('Choose number cannot be greater than option');
            return;
        }

        try {
            const res = await fetch('/api/combo/create-combo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comboName,
                    option,
                    chooseNumber,
                    productDetails,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setCombos(prev => [...prev, data]);
                setErrorMessage(null);
                setShowModal(false);
                setComboName('');
                setOption(1);
                setChooseNumber(1);
                setProductDetails([{ productname: '', comboquantity: '' }]);
                fetchCombos();
            } else {
                setErrorMessage(data.message);
            }
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const handleDeleteCombo = async (comboId) => {
        try {
            const res = await fetch(`/api/combo/delete-combo/${comboId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchCombos();
            } else {
                const data = await res.json();
                setErrorMessage(data.message);
            }
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const handleCreateModal = () => {
        setShowModal(!showModal);
        setErrorMessage(null);
    };

    const handleOptionChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setOption(value);
        setProductDetails(Array.from({ length: value }, () => ({ productname: '', comboquantity: '' })));
        if (chooseNumber > value) {
            setChooseNumber(value);
        }
    };

    const handleProductDetailChange = (index, field, value) => {
        const newProductDetails = [...productDetails];
        newProductDetails[index][field] = value;
        setProductDetails(newProductDetails);
    };

    const handleEdit = (combo) => {
        setEditingCombo(combo);
        setComboName(combo.comboName._id);
        setOption(combo.option);
        setChooseNumber(combo.chooseNumber);
        setProductDetails(Array.from({ length: combo.option }, (_, index) => 
            combo.productDetails[index] || { productname: '', comboquantity: '' }
        ));
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (chooseNumber > option) {
            setErrorMessage('Choose number cannot be greater than option');
            return;
        }
        
        try {
            const res = await fetch(`/api/combo/update-combo/${editingCombo._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comboName,
                    option,
                    chooseNumber,
                    productDetails,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setShowEditModal(false);
                fetchCombos();
            } else {
                setErrorMessage(data.message);
            }
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const filteredCombos = combos.filter(combo => {
        const comboNameMatch = combo.comboName && combo.comboName.productname && 
            combo.comboName.productname.toLowerCase().includes(searchKeyword.toLowerCase());
    
        const productDetailsMatch = combo.productDetails && 
            combo.productDetails.some(product => 
                product && product.productname && 
                product.productname.toLowerCase().includes(searchKeyword.toLowerCase())
            );
    
        return comboNameMatch || productDetailsMatch;
    });

    const totalPages = Math.ceil(filteredCombos.length / ITEMS_PER_PAGE);
    const paginatedCombos = filteredCombos.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className='w-full max-w-4xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl text-gray-500 font-semibold'>Combos</h1>
                <div className='flex items-center gap-2'>
                    <TextInput 
                        type='text' 
                        placeholder='Search' 
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <Button onClick={handleCreateModal}>Create combo</Button>
                </div>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell>Combo Name</Table.HeadCell>
                    <Table.HeadCell>Options</Table.HeadCell>
                    <Table.HeadCell>Choose</Table.HeadCell>
                    <Table.HeadCell>Product Name</Table.HeadCell>
                    <Table.HeadCell>Quantity</Table.HeadCell>
                    <Table.HeadCell>Delete</Table.HeadCell>
                    <Table.HeadCell><span>Edit</span></Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {paginatedCombos.map((combo) => (
                        combo.productDetails.map((product, index) => (
                            <Table.Row key={`${combo._id}-${index}`}>
                                {index === 0 && (
                                    <>
                                        <Table.Cell rowSpan={combo.productDetails.length}>
                                            {combo.comboName.productname}
                                        </Table.Cell>
                                        <Table.Cell rowSpan={combo.productDetails.length}>
                                            {combo.option}
                                        </Table.Cell>
                                        <Table.Cell rowSpan={combo.productDetails.length}>
                                            {combo.chooseNumber}
                                        </Table.Cell>
                                    </>
                                )}
                                <Table.Cell>{product.productname}</Table.Cell>
                                <Table.Cell>{product.comboquantity}</Table.Cell>
                                {index === 0 && (
                                    <>
                                        <Table.Cell rowSpan={combo.productDetails.length}>
                                            <Button color="failure" onClick={() => handleDeleteCombo(combo._id)}>Delete</Button>
                                        </Table.Cell>
                                        <Table.Cell rowSpan={combo.productDetails.length}>
                                            <Button color="warning" onClick={() => handleEdit(combo)}>Edit</Button>
                                        </Table.Cell>
                                    </>
                                )}
                            </Table.Row>
                        ))
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

            {/* Create Combo Modal */}
            <Modal show={showModal} popup onClose={() => setShowModal(false)} size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className='text-gray-500 text-2xl font-semibold'>Create combo</h1>
                        {errorMessage && (
                            <Alert color='failure'>
                                {errorMessage}
                            </Alert>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateCombo(); }}>
                            <div className='mt-4'>
                                <Label value='Combo Name' />
                                <Select
                                    value={comboName}
                                    onChange={(e) => setComboName(e.target.value)}
                                    required
                                >
                                    <option value="">Select Combo Category</option>
                                    {comboProducts.map((product) => (
                                        <option key={product._id} value={product._id}>{product.productname}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className='mt-4'>
                                <Label value='Total Options' />
                                <TextInput
                                    type="number"
                                    value={option}
                                    onChange={handleOptionChange}
                                    min="1"
                                    placeholder="Enter total options"
                                    required
                                />
                            </div>
                            <div className='mt-4'>
                                <Label value='Choose Number (how many to select)' />
                                <TextInput
                                    type="number"
                                    value={chooseNumber}
                                    onChange={(e) => setChooseNumber(parseInt(e.target.value))}
                                    min="1"
                                    max={option}
                                    placeholder="Enter number of products to choose"
                                    required
                                />
                            </div>
                            {productDetails.map((detail, index) => (
                                <div key={index}>
                                    <div className='mt-4'>
                                        <Label value={`Product Name ${index + 1}`} />
                                        <Select
                                            value={detail.productname}
                                            onChange={(e) => handleProductDetailChange(index, 'productname', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Single Product</option>
                                            {singleProducts.map((product) => (
                                                <option key={product._id} value={product.productname}>{product.productname}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div className='mt-4 mb-4'>
                                        <Label value={`Product Quantity ${index + 1}`} />
                                        <TextInput
                                            type="number"
                                            value={detail.comboquantity}
                                            onChange={(e) => handleProductDetailChange(index, 'comboquantity', e.target.value)}
                                            min="1"
                                            placeholder="Enter Product Quantity"
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button type='submit'>Create</Button>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Edit Combo Modal */}
            <Modal show={showEditModal} popup onClose={() => setShowEditModal(false)} size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className='text-gray-500 text-2xl font-semibold'>Update combo</h1>
                        {errorMessage && (
                            <Alert color='failure'>
                                {errorMessage}
                            </Alert>
                        )}
                        <form onSubmit={handleEditSubmit}>
                            <div className='mt-4'>
                                <Label value='Total Options' />
                                <TextInput
                                    type="number"
                                    value={option}
                                    onChange={handleOptionChange}
                                    min="1"
                                    placeholder="Enter total options"
                                    required
                                />
                            </div>
                            <div className='mt-4'>
                                <Label value='Choose Number (how many to select)' />
                                <TextInput
                                    type="number"
                                    value={chooseNumber}
                                    onChange={(e) => setChooseNumber(parseInt(e.target.value))}
                                    min="1"
                                    max={option}
                                    placeholder="Enter number of products to choose"
                                    required
                                />
                            </div>
                            {productDetails.map((detail, index) => (
                                <div key={index}>
                                    <div className='mt-4'>
                                        <Label value={`Product Name ${index + 1}`} />
                                        <Select
                                            value={detail.productname}
                                            onChange={(e) => handleProductDetailChange(index, 'productname', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Single Product</option>
                                            {singleProducts.map((product) => (
                                                <option key={product._id} value={product.productname}>{product.productname}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div className='mt-4 mb-4'>
                                        <Label value={`Product Quantity ${index + 1}`} />
                                        <TextInput
                                            type="number"
                                            value={detail.comboquantity}
                                            onChange={(e) => handleProductDetailChange(index, 'comboquantity', e.target.value)}
                                            min="1"
                                            placeholder="Enter Product Quantity"
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button type='submit'>Update</Button>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Combo;