import { Button, Table, Modal, Label, TextInput, Select, Alert, Pagination } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const Stock = () => {
    const [formData, setFormData] = useState({});
    const [errorMessage, setErrorMessage] = useState(null);
    const [wareHouses, setWareHouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7); // 每页显示的条目数
    const [searchTerm, setSearchTerm] = useState(''); // 搜索框的输入
    const [sortByDate, setSortByDate] = useState('desc'); // 日期排序方式

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
            // 按日期排序
            const sortedStocks = stocksWithActionType.sort((a, b) => {
                return sortByDate === 'asc' 
                    ? new Date(a.updatedAt) - new Date(b.updatedAt)
                    : new Date(b.updatedAt) - new Date(a.updatedAt);
            });
            setStocks(sortedStocks);
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

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    // 过滤和排序 stocks
    const filteredStocks = stocks.filter(stock => {
        const searchLower = searchTerm.toLowerCase();
        return (
            stock.productname.toLowerCase().includes(searchLower) ||
            stock.stockcode.toLowerCase().includes(searchLower) ||
            stock.warehouse?.warehousename.toLowerCase().includes(searchLower) ||
            stock.stockquantity.toString().includes(searchLower) ||
            stock.actionType.toLowerCase().includes(searchLower) ||
            new Date(stock.createdAt).toLocaleDateString().includes(searchLower)
        );
    });

    // 计算当前页的数据
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStocks = filteredStocks.slice(indexOfFirstItem, indexOfLastItem);

    // 处理页码变化
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // 处理日期排序
    const handleSortByDate = () => {
        setSortByDate(sortByDate === 'desc' ? 'asc' : 'desc');
        fetchStocks(); // 重新获取并排序数据
    };

    const generateExcelReport = () => {
        // 创建一个工作表
        const ws = XLSX.utils.json_to_sheet(stocks.map(stock => ({
            Date: new Date(stock.createdAt).toLocaleDateString(),
            Warehouse: stock.warehouse?.warehousename,
            'Stock Code': stock.stockcode,
            Quantity: stock.stockquantity,
            Product: stock.productname,
            'In/Out': stock.actionType === 'in' ? 'In' : 'Out'
        })));

        // 创建一个工作簿
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Stock Report");

        // 生成 Excel 文件并触发下载
        XLSX.writeFile(wb, 'StockReport.xlsx');
    }

    return (
        <div className='w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold text-gray-500'>Stock</h1>
                <div className='flex items-center gap-2'>
                    <TextInput 
                        type="text" 
                        placeholder="Search stock code" 
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                <Button onClick={handleModal}>Create Stock</Button>
                <Button onClick={generateExcelReport}>Report</Button>
                </div>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell onClick={handleSortByDate} className="cursor-pointer">
                        Date {sortByDate === 'asc' ? '↑' : '↓'}
                    </Table.HeadCell>
                    <Table.HeadCell>Warehouse</Table.HeadCell>
                    <Table.HeadCell>Stock Code</Table.HeadCell>
                    <Table.HeadCell>Quantity</Table.HeadCell>
                    <Table.HeadCell>Product</Table.HeadCell>
                    <Table.HeadCell>In/Out</Table.HeadCell>
                    <Table.HeadCell><span>Delete</span></Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {currentStocks.map((stock) => (
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
                                <Button 
                                    color="failure" 
                                    onClick={() => handleDelete(stock._id)}
                                    disabled={stock.actionType === 'out'} // 当 actionType 为 'out' 时禁用按钮
                                >
                                    Delete
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            {/* 分页控件 */}
            <div className="flex justify-center mt-4">
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredStocks.length / itemsPerPage)}
                    onPageChange={handlePageChange}
                />
            </div>

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