import { Button, Table, Modal, Label, TextInput, Select, Alert } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

const Stock = () => {
    const [formData, setFormData] = useState({});
    const [errorMessage, setErrorMessage] = useState(null);
    const [wareHouses, setWareHouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetchWareHouses();
        fetchProducts();
        fetchStocks();
    }, []);

    const fetchWareHouses = async () => {
        const res = await fetch('/api/inventory/get-warehouses');
        const data = await res.json();
        if (res.ok) {
            setWareHouses(data);
        } else {
            console.error(error);
        }
    };

    const fetchProducts = async () => {
        const res = await fetch('/api/product/get-products');
        const data = await res.json();
        if (res.ok) {
            setProducts(data);
        } else {
            console.error(error);
        }
    };

    const fetchStocks = async () => {
        const res = await fetch('/api/stock/get-stocks');
        const data = await res.json();
        if (res.ok) {
            const stocksWithActionType = data.map(stock => ({ 
                ...stock, 
                actionType: stock.lastActionType || 'in' // 使用数据库中的 lastActionType
            }));
            setStocks(stocksWithActionType);
        } else {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
    };

    const handleModal = () => {
        setOpenModal(!openModal);
        setErrorMessage(null);
    };

    const handleProductSelect = (productId) => {
        const product = products.find(p => p._id === productId);
        setSelectedProduct(product);
        setFormData({ ...formData, productname: product.productname });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/stock/create-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    warehouse: formData.warehousename,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setOpenModal(false);
                setErrorMessage(null);
                fetchStocks();
            } else {
                setErrorMessage(data.message);
            }
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const handleInOut = async (stockId) => {
        try {
            const stock = stocks.find(s => s._id === stockId);
            const type = stock.actionType === 'in' ? 'out' : 'in'; // 切换类型
    
            const res = await fetch(`/api/stock/update-stock/${stockId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }), // 发送新的类型
            });
            const data = await res.json();
            if (res.ok) {
                const updatedStocks = stocks.map(s => 
                    s._id === stockId ? { ...s, actionType: type } : s
                );
                setStocks(updatedStocks); // 更新本地状态
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    const handleDelete = async (stockId) => {
        try {
            const res = await fetch(`/api/stock/delete-stock/${stockId}`,{
                method: 'DELETE'
            })
            const data = await res.json()
            if(res.ok){
                fetchStocks();
            }else{
                console.log(data.message)
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold text-gray-500'>Stock</h1>
                <Button onClick={handleModal}>Create Stock</Button>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell>Date</Table.HeadCell>
                    <Table.HeadCell>Warehouse</Table.HeadCell>
                    <Table.HeadCell>Stock Code</Table.HeadCell>
                    <Table.HeadCell>Quantity</Table.HeadCell>
                    <Table.HeadCell>Product</Table.HeadCell>
                    <Table.HeadCell>In/Out</Table.HeadCell>
                    <Table.HeadCell><span>Delete</span></Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {stocks.map((stock) => (
                        <Table.Row key={stock._id}>
                            <Table.Cell>{new Date(stock.createdAt).toLocaleDateString()}</Table.Cell>
                            <Table.Cell>{stock.warehouse?.warehousename}</Table.Cell>
                            <Table.Cell>{stock.stockcode}</Table.Cell>
                            <Table.Cell>{stock.stockquantity}</Table.Cell>
                            <Table.Cell>{stock.productname}</Table.Cell>
                            <Table.Cell>
                                <Button 
                                    color={stock.actionType === 'in' ? 'success' : 'warning'} 
                                    onClick={() => handleInOut(stock._id)}
                                >
                                    {stock.actionType === 'in' ? 'In' : 'Out'}
                                </Button>
                            </Table.Cell>
                            <Table.Cell>
                                <Button color="failure" onClick={() => {handleDelete(stock._id)}}>Delete</Button>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            <Modal show={openModal} size="md" popup onClose={handleModal}>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className="text-2xl text-gray-500 font-semibold">Create Stock</h1>
                        {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                        <form onSubmit={handleSubmit}>
                            <div className="mt-4">
                                <Label value="Warehouse" />
                                <Select id="warehousename" onChange={handleChange} required>
                                    <option value="">Select Warehouse</option>
                                    {wareHouses.map((warehouse) => (
                                        <option key={warehouse._id} value={warehouse._id}>{warehouse.warehousename}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="mt-4">
                                <Label value="Product Name" />
                                <Select id="productname" onChange={(e) => handleProductSelect(e.target.value)} required>
                                    <option value="">Select Product</option>
                                    {products.map((product) => (
                                        <option key={product._id} value={product._id}>{product.productname}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="mt-4">
                                <Label value="Stock Code" />
                                <TextInput type="text" id="stockcode" placeholder="Enter Stock Code" 
                                maxLength={25} onChange={handleChange} required />
                            </div>
                            <div className="mt-4 mb-4">
                                <Label value="Quantity" />
                                <TextInput type="number" id="stockquantity" placeholder="Enter Quantity" onChange={handleChange} required />
                            </div>
                            <Button type="submit">Submit</Button>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Stock;