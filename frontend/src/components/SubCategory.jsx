import { Alert, Button, Label, Modal, Pagination, Table, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

const SubCategory = () => {
    const [subCategories, setSubCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    // State for edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [newName, setNewName] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        fetchSubCategories();
    }, []);

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

    const handleDelete = async (subCategoryId) => {
        try {
            const res = await fetch(`/api/product/delete-subcategory/${subCategoryId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                // Refresh the subcategories list after deletion
                fetchSubCategories();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditClick = (subCategory) => {
        setSelectedSubCategory(subCategory);
        setNewName(subCategory.name);
        setShowEditModal(true);
        setErrorMessage(null)        
    };

    const handleUpdate = async () => {
        try {
            const res = await fetch(`/api/product/update-subcategory/${selectedSubCategory._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName }),
            });
            const data = await res.json();
            if (res.ok) {
                // Refresh the subcategories list after update
                fetchSubCategories();
                setShowEditModal(false);
            } else {
                setErrorMessage(data.message || 'Failed to update subcategory');
            }
        } catch (error) {
            setErrorMessage('Something went wrong');
            console.error(error);
        }
    };

    const totalPages = Math.ceil(subCategories.length / ITEMS_PER_PAGE);

    const getPaginationData = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return subCategories.slice(startIndex, endIndex);
    };

    return (
        <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div className=''>
                <h1 className='text-2xl font-semibold text-gray-500'>Sub Categories</h1>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell>Sub Category</Table.HeadCell>
                    <Table.HeadCell>Delete</Table.HeadCell>
                    <Table.HeadCell>Edit</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {getPaginationData().map((subCategory) => (
                        <Table.Row key={subCategory._id}>
                            <Table.Cell>{subCategory.name}</Table.Cell>
                            <Table.Cell>
                                <Button color="failure" onClick={() => handleDelete(subCategory._id)}>
                                    Delete
                                </Button>
                            </Table.Cell>
                            <Table.Cell>
                                <Button color='warning' onClick={() => handleEditClick(subCategory)}>
                                    Edit
                                </Button>
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

            {/* Edit Modal */}
            <Modal show={showEditModal} size='md' onClose={() => setShowEditModal(false)}>
                <Modal.Header>Edit Sub Category</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <Label htmlFor="subCategoryName">Sub Category Name</Label>
                        <TextInput
                            id="subCategoryName"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value.trim())}
                            placeholder="Enter new name"
                        />
                        {errorMessage && <Alert color="failure">{errorMessage}</Alert>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleUpdate}>Submit</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default SubCategory;