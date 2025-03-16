import React, { useEffect, useState } from 'react';
import { Button, Label, Pagination, Table, TextInput } from 'flowbite-react';
import * as XLSX from 'xlsx';

const ReserveReport = () => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredTables, setFilteredTables] = useState([]);
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 获取所有表格数据
      const res = await fetch('/api/table/get-tables');
      const tables = await res.json();

      // 过滤表格数据
      const filtered = tables.filter(table => {
        if (!table.reserve.timestamp) return false; // 如果没有预订时间，不显示

        const reserveDate = new Date(table.reserve.timestamp);
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        // 检查预订时间是否在 startDate 和 endDate 之间
        return reserveDate >= startDate && reserveDate <= endDate;
      });

      // 按预订时间排序，最旧的日期在最上面
      filtered.sort((a, b) => new Date(a.reserve.timestamp) - new Date(b.reserve.timestamp));

      // 更新过滤后的表格数据
      setFilteredTables(filtered);
      setCurrentPage(1)
    } catch (error) {
      console.error(error);
    }
  };

  // 导出 Excel 文件
  const exportToExcel = () => {
    // 准备数据
    const data = filteredTables.map(table => ({
      Table: table.tablename,
      Customer: table.reserve.customername,
      Phone: table.reserve.phonenumber,
      Pax: table.reserve.pax,
      Reservation: new Date(table.reserve.timestamp).toLocaleString(),
    }));

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservations');

    // 生成 Excel 文件并下载
    XLSX.writeFile(workbook, 'ReservationReport.xlsx');
  };

  const totalPages = Math.ceil(filteredTables.length / ITEMS_PER_PAGE)

    const getPaginationData = () => {
        const startIndex = (currentPage - 1)* ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        return filteredTables.slice(startIndex, endIndex)
    }

  return (
    <div className="w-full max-w-5xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300">
      <div className="flex items-center justify-between">
        <h1 className="text-gray-500 text-2xl font-semibold">Reports</h1>
        <form className='flex items-center gap-2' onSubmit={handleSubmit}>
          <Label value='Start Date :' />
          <TextInput type="date" id='startDate' onChange={handleChange} required />
          <Label value='End Date :' />
          <TextInput type="date" id='endDate' onChange={handleChange} required />
          <Button type='submit'>Search</Button>
          <Button onClick={exportToExcel} color='success' disabled={filteredTables.length === 0}>Report</Button>
        </form>
      </div>

      <Table hoverable className="shadow-md mt-4">
        <Table.Head>
          <Table.HeadCell>Table</Table.HeadCell>
          <Table.HeadCell>Customer (phone)</Table.HeadCell>
          <Table.HeadCell>Pax</Table.HeadCell>
          <Table.HeadCell>Reservation</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {getPaginationData().map((table) => (
            <Table.Row key={table._id}>
              <Table.Cell>{table.tablename}</Table.Cell>
              <Table.Cell>{table.reserve.customername} ({table.reserve.phonenumber})</Table.Cell>
              <Table.Cell>{table.reserve.pax}</Table.Cell>
              <Table.Cell>{new Date(table.reserve.timestamp).toLocaleString()}</Table.Cell>
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

export default ReserveReport;