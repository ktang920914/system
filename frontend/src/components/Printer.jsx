import { Button, Table, Modal, Label, TextInput, Select, Alert, Pagination } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

const Printer = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [formData, setFormData] = useState({ printername: '', printerip: '', areas: [] });
    const [errorMessage, setErrorMessage] = useState(null);
    const [printers, setPrinters] = useState([]);
    const [areas, setAreas] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    useEffect(() => {
        const fetchPrinters = async () => {
            try {
                const res = await fetch('/api/printer/get-printers');
                const data = await res.json();
                if (res.ok) {
                    setPrinters(data);
                }
            } catch (error) {
                console.log(error.message);
            }
        };

        const fetchAreas = async () => {
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

        fetchPrinters();
        fetchAreas();
    }, []);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleAreaChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
        setFormData({ ...formData, areas: selectedOptions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/printer/create-printer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success === false) {
                setErrorMessage(data.message);
            }
            if (res.ok) {
                setOpenModal(false);
                setErrorMessage(null);
                const res = await fetch('/api/printer/get-printers');
                const data = await res.json();
                if (res.ok) {
                    setPrinters(data);
                }
            }
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/printer/update-printer/${selectedPrinter._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                setOpenEditModal(false);
                setErrorMessage(null);
                const updatedPrinters = printers.map(printer => printer._id === selectedPrinter._id ? data : printer);
                setPrinters(updatedPrinters);
            } else {
                setErrorMessage(data.message);
            }
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const handleDelete = async (printerId) => {
        try {
            const res = await fetch(`/api/printer/delete-printer/${printerId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok) {
                setPrinters((prevPrinters) => prevPrinters.filter((printer) => printer._id !== printerId));
            } else {
                console.log(data.message);
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleEditModal = (printer) => {
        setSelectedPrinter(printer);
        setFormData({ printername: printer.printername, printerip: printer.printerip, areas: printer.areas });
        setOpenEditModal(true);
        setErrorMessage(null);
    };

    const handleClick = () => {
      setOpenModal(!openModal)
      setErrorMessage(null)
    }

    const totalPages = Math.ceil(printers.length / ITEMS_PER_PAGE);

    const getPaginationData = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return printers.slice(startIndex, endIndex);
    };

    return (
        <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div className='flex items-center justify-between'>
                <h1 className='text-gray-500 font-semibold text-2xl'>Printers</h1>
                <Button onClick={() => {handleClick()}}>Create Printer</Button>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell>Printer Name</Table.HeadCell>
                    <Table.HeadCell>Printer IP</Table.HeadCell>
                    <Table.HeadCell>Areas</Table.HeadCell>
                    <Table.HeadCell>Delete</Table.HeadCell>
                    <Table.HeadCell><span>Edit</span></Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {getPaginationData().map((printer) => (
                        <Table.Row key={printer._id}>
                            <Table.Cell>{printer.printername}</Table.Cell>
                            <Table.Cell>{printer.printerip}</Table.Cell>
                            <Table.Cell>{printer.areas.join(', ')}</Table.Cell>
                            <Table.Cell>
                                <Button color="failure" onClick={() => handleDelete(printer._id)}>Delete</Button>
                            </Table.Cell>
                            <Table.Cell>
                                <Button color="warning" onClick={() => handleEditModal(printer)}>Edit</Button>
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

            {/* Create Printer Modal */}
            <Modal show={openModal} size="md" popup onClose={() => setOpenModal(false)}>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className="text-2xl text-gray-500 font-semibold">Create Printer</h1>
                        {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                        <form onSubmit={handleSubmit}>
                            <div className="mt-4">
                                <Label value="Printer Name" />
                                <TextInput type='text' id="printername" placeholder="Printer Name" onChange={handleChange} required />
                            </div>
                            <div className="mt-4">
                                <Label value="Printer IP" />
                                <TextInput type='text' id="printerip" placeholder="192.168.1.1" onChange={handleChange} required />
                            </div>
                            <div className="mt-4">
                                <Label value="Areas" />
                                <Select id="areas" multiple onChange={handleAreaChange} required>
                                    {areas.map((area) => (
                                        <option key={area._id} value={area.areaname}>{area.areaname}</option>
                                    ))}
                                </Select>
                            </div>
                            <Button type='submit'>Submit</Button>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Edit Printer Modal */}
            <Modal show={openEditModal} size="md" popup onClose={() => setOpenEditModal(false)}>
                <Modal.Header />
                <Modal.Body>
                    <div className="space-y-2">
                        <h1 className="text-2xl text-gray-500 font-semibold">Update Printer</h1>
                        {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                        <form onSubmit={handleEditSubmit}>
                            <div className="mt-4">
                                <Label value="Printer Name" />
                                <TextInput type='text' id="printername" placeholder="Printer Name" onChange={handleChange} value={formData.printername} required />
                            </div>
                            <div className="mt-4">
                                <Label value="Printer IP" />
                                <TextInput type='text' id="printerip" placeholder="192.168.1.1" onChange={handleChange} value={formData.printerip} required />
                            </div>
                            <div className="mt-4">
                                <Label value="Areas" />
                                <Select id="areas" multiple onChange={handleAreaChange} value={formData.areas} required>
                                    {areas.map((area) => (
                                        <option key={area._id} value={area.areaname}>{area.areaname}</option>
                                    ))}
                                </Select>
                            </div>
                            <Button type='submit'>Submit</Button>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Printer;