import { Alert, Button, Label, Modal, Pagination, Table, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

const SubCategory = () => {
    const [subCategories, setSubCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

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

    const totalPages = Math.ceil(subCategories.length / ITEMS_PER_PAGE);

    const getPaginationData = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return subCategories.slice(startIndex, endIndex);
    };

    return (
        <div className='w-full max-w-3xl table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300'>
            <div>
                <h1 className='text-2xl font-semibold text-gray-500'>Sub Categories</h1>
            </div>

            <Table hoverable className='shadow-md mt-4'>
                <Table.Head>
                    <Table.HeadCell>Sub Category</Table.HeadCell>
                    <Table.HeadCell>Delete</Table.HeadCell>
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

export default SubCategory;