import { Alert, Badge, Button, Card, Label, Modal, Pagination, Popover, Select, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

const ReserveTable = () => {
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [formData, setFormData] = useState({});
  const [openReserveModal, setOpenReserveModal] = useState(false);
  const [openOpenTableModal, setOpenOpenTableModal] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentTable, setCurrentTable] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [disabledTables, setDisabledTables] = useState({}); // 新增状态变量
  const ITEMS_PER_PAGE = 14;

  useEffect(() => {
    const FetchAreas = async () => {
      try {
        const res = await fetch('/api/area/get-areas');
        const data = await res.json();
        if (res.ok) {
          setAreas(data);
        }
      } catch (error) {
        console.log(error.message);
      }
    };
    FetchAreas();
  }, []);

  useEffect(() => {
    const FetchTables = async () => {
      try {
        const res = await fetch('/api/table/get-tables');
        const data = await res.json();
        if (res.ok) {
          const sortedTables = data.sort((a, b) => {
            const aNumber = parseInt(a.tablename.match(/\d+/)[0]);
            const bNumber = parseInt(b.tablename.match(/\d+/)[0]);
            if (aNumber !== bNumber) {
              return bNumber - aNumber;
            }
            return new Date(b.updatedAt) - new Date(a.updatedAt);
          });
          setTables(sortedTables);
        }
      } catch (error) {
        console.log(error.message);
      }
    };
    FetchTables();
    const interval = setInterval(FetchTables, 10000);

    // 组件卸载时清除定时器
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleReserveModal = (table) => {
    // 检查桌子是否已经处于 "Open" 状态或已被禁用
    if (table.open.status || disabledTables[table._id]) {
      return; // 如果桌子已经打开或已被禁用，则不执行任何操作
    }

    setSelectedTableId(table._id);
    setCurrentTable(table.tablename);
    setOpenReserveModal(true);
    setErrorMessage(null);
  };

  const handleOpenTableModal = (table) => {
    setSelectedTableId(table._id);
    setCurrentTable(table.tablename);
    setOpenOpenTableModal(true);
    setErrorMessage(null);
  };

  const handleReserveSubmit = async (e) => {
    e.preventDefault();

    // 获取当前选中的表格
    const selectedTable = tables.find((table) => table._id === selectedTableId);
    const tablePax = selectedTable ? selectedTable.tablepax : 0;

    // 检查输入的 pax 是否超过表格容量
    if (formData.pax > tablePax) {
      setErrorMessage(`Pax cannot exceed the table capacity (${tablePax}).`);
      return;
    }

    try {
      const res = await fetch(`/api/table/reserve-table/${selectedTableId}`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setOpenReserveModal(false);
        setErrorMessage(null);
        setFormData({});

        // 禁用当前表格的点击功能
        setDisabledTables((prev) => ({
          ...prev,
          [selectedTableId]: true, // 标记为禁用
        }));

        // 重新获取表格数据以更新 UI
        const fetchTables = async () => {
          const res = await fetch('/api/table/get-tables');
          const data = await res.json();
          if (res.ok) {
            setTables(data);
          }
        };
        fetchTables();
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleCancelReserve = async (tableId) => {
    try {
      const res = await fetch(`/api/table/cancel-reserve/${tableId}`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (res.ok) {
        // 重新启用当前表格的点击功能
        setDisabledTables((prev) => ({
          ...prev,
          [tableId]: false, // 标记为启用
        }));

        const fetchTables = async () => {
          const res = await fetch('/api/table/get-tables');
          const data = await res.json();
          if (res.ok) {
            setTables(data);
          }
        };
        fetchTables();
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleAreaFilterChange = (e) => {
    setSelectedArea(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenTableSubmit = async (e) => {
    e.preventDefault();
    const selectedTable = tables.find((table) => table._id === selectedTableId);
    const tablePax = selectedTable ? selectedTable.tablepax : 0;

    // 检查输入的 pax 是否超过表格容量
    if (formData.pax > tablePax) {
      setErrorMessage(`Pax cannot exceed the table capacity (${tablePax}).`);
      return;
    }

    try {
      const res = await fetch(`/api/table/open-table/${selectedTableId}`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reserve: {
            status: false,
            customername: null,
            phonenumber: null,
            pax: null,
            timestamp: null,
          },
          open: {
            status: true,
            customername: formData.customername,
            phonenumber: formData.phonenumber,
            pax: formData.pax,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (res.ok) {
        setOpenOpenTableModal(false);
        setErrorMessage(null);
        setFormData({});

        // 重新获取表格数据以更新 UI
        const fetchTables = async () => {
          const res = await fetch('/api/table/get-tables');
          const data = await res.json();
          if (res.ok) {
            setTables(data);
          }
        };
        fetchTables();
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleToggleOpenStatus = async (tableId) => {
    try {
      const res = await fetch(`/api/table/toggle-open-status/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
          open: {
            status: false, // 直接将 open.status 设置为 false
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // 重新启用当前表格的点击功能
        setDisabledTables((prev) => ({
          ...prev,
          [tableId]: false, // 标记为启用
        }));

        const fetchTables = async () => {
          const res = await fetch('/api/table/get-tables');
          const data = await res.json();
          if (res.ok) {
            setTables(data);
          }
        };
        fetchTables();
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const filteredTables = tables.filter((table) => {
    const areaMatch = selectedArea ? table.area === selectedArea : true;
    const statusMatch = selectedStatus
      ? selectedStatus === 'reservation'
        ? table.reserve.status
        : selectedStatus === 'open'
        ? table.open.status
        : true
      : true;
    return areaMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredTables.length / ITEMS_PER_PAGE);

  const getPaginationData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTables.slice(startIndex, endIndex);
  };

  return (
    <div className="w-full max-w-4xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-500">Reserves</h1>
        <div className="flex items-center gap-2">
          <Select id="areaFilter" onChange={handleAreaFilterChange} value={selectedArea}>
            <option value="">All Areas</option>
            {areas.map((area) => (
              <option key={area._id} value={area._id}>
                {area.areaname}
              </option>
            ))}
          </Select>
          <Select id="statusFilter" onChange={handleStatusFilterChange} value={selectedStatus}>
            <option value="">All Status</option>
            <option value="reservation">Reservation</option>
            <option value="open">Open</option>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-7 md:grid-cols-4 sm:grid-cols-3 gap-4 mt-4">
        {getPaginationData().map((table) => (
          <Popover
            key={table._id}
            content={
              <div className="p-3">
                <p>Table: {table.tablename}</p>
                {table.reserve.status && (
                  <>
                    <p>Customer: {table.reserve.customername}</p>
                    <p>Phone: {table.reserve.phonenumber}</p>
                    <p>Pax: {table.reserve.pax}</p>
                    <p>Date: {new Date(table.reserve.timestamp).toLocaleString()}</p>
                    <Button color="failure" size="sm" onClick={() => handleCancelReserve(table._id)}>
                      Cancel Reserve
                    </Button>
                  </>
                )}
                {table.open.status && (
                  <>
                    <p>Customer: {table.open.customername}</p>
                    <p>Phone: {table.open.phonenumber}</p>
                    <p>Pax: {table.open.pax}</p>
                    <p>Date: {new Date(table.open.timestamp).toLocaleString()}</p>
                    <Button color="failure" size="sm" onClick={() => handleToggleOpenStatus(table._id)}>
                      Close Table
                    </Button>
                  </>
                )}
              </div>
            }
            trigger="hover"
          >
            <Card
              className={`break-words cursor-pointer ${
                table.open.status
                  ? 'bg-yellow-200' // 打开后变黄色
                  : table.reserve.status
                  ? 'bg-red-200' // 预订后变红色
                  : 'bg-green-200' // 默认青色
              }`}
              onClick={() => {
                // 如果表格未被禁用且未打开，则触发 handleReserveModal
                if (!table.open.status && !disabledTables[table._id]) {
                  handleReserveModal(table);
                }
              }}
            >
              <h3 className="text-lg font-semibold">{table.tablename}</h3>
              <p>Pax: {table.tablepax}</p>
              <p>Min Spent: RM{table.minimumspent}</p>
              <Badge
                color={table.open.status ? 'failure' : 'success'}
                onClick={(e) => {
                  e.stopPropagation();
                  if (table.open.status) {
                    handleToggleOpenStatus(table._id); // 直接切换状态为 false
                  } else {
                    handleOpenTableModal(table); // 打开 Modal
                  }
                }}
                className="cursor-pointer flex justify-center"
              >
                {table.open.status ? 'Close' : 'Open'}
              </Badge>
            </Card>
          </Popover>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Reserve Table Modal */}
      <Modal show={openReserveModal} size="lg" popup onClose={() => setOpenReserveModal(false)}>
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-2">
            <h1 className="text-2xl text-gray-500 font-semibold">Reserve {currentTable} table</h1>
            {errorMessage && <Alert color="failure">{errorMessage}</Alert>}
            <form onSubmit={handleReserveSubmit}>
              <div className="mt-4">
                <Label value="Customer name" />
                <TextInput
                  type="text"
                  id="customername"
                  placeholder="Enter customer name"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mt-4 mb-4">
                <Label value="Customer phone" />
                <TextInput
                  type="number"
                  id="phonenumber"
                  placeholder="012-3456789"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mt-4 mb-4">
                <Label value="Pax" />
                <TextInput
                  type="number"
                  id="pax"
                  placeholder="Enter pax"
                  min={1}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mt-4 mb-4">
                <Label value="Reserve date" />
                <TextInput
                  type="datetime-local"
                  id="reservedate"
                  onChange={handleChange}
                  required
                />
              </div>
              <Button type="submit">Submit</Button>
            </form>
          </div>
        </Modal.Body>
      </Modal>

      {/* Open Table Modal */}
      <Modal show={openOpenTableModal} size="lg" popup onClose={() => setOpenOpenTableModal(false)}>
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-2">
            <h1 className="text-2xl text-gray-500 font-semibold">Open {currentTable} table</h1>
            {errorMessage && <Alert color="failure">{errorMessage}</Alert>}
            <form onSubmit={handleOpenTableSubmit}>
              <div className="mt-4">
                <Label value="Customer name" />
                <TextInput
                  type="text"
                  id="customername"
                  placeholder="Enter customer name"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mt-4 mb-4">
                <Label value="Customer phone" />
                <TextInput
                  type="number"
                  id="phonenumber"
                  placeholder="012-3456789"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mt-4 mb-4">
                <Label value="Pax" />
                <TextInput
                  type="number"
                  id="pax"
                  placeholder="Enter pax"
                  onChange={handleChange} min={1}
                  required
                />
              </div>
              <Button type="submit">Submit</Button>
            </form>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ReserveTable;