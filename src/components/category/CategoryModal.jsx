import React, { useState, useEffect, useRef, useContext } from 'react';
import Modal from 'react-modal';
import { MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, XMarkIcon } from '@heroicons/react/24/solid'; // Import v2 icons
import ActionButton from '../../components/ActionButton';
import { AppContext } from '../../store/app-context';
import AddCategory from './AddCategory';

Modal.setAppElement('#root'); // For accessibility reasons

const CategoryModal = ({ isOpen, onClose }) => {

    const { allCategories } = useContext(AppContext)

    const handleEdit = (id) => {
        // Handle edit logic (e.g., show a modal or navigate to an edit page)
        // console.log(`Edit category with id: ${id}`);
    };

    const handleDelete = (id) => {
        // setCategories(categories.filter(category => category.id !== id));
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed inset-0 bg-black bg-opacity-75"
        >
            <div className="relative flex flex-col bg-white p-5 rounded-sm shadow-lg max-w-[80vh] max-h-[60vh]">
                <div className='flex justify-between mb-3'>
                    <h2 className='text-lg text-gray-600 uppercase'>Categories</h2>
                    <button
                        onClick={onClose}
                        className="text-gray p-1 rounded-full hover:bg-red-700 focus:outline-none transition-all duration-300 flex items-center justify-center"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <AddCategory></AddCategory>
                <div className="overflow-y-auto flex-1">
                    <table className="bg-white border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Name</th>
                                <th className="py-3 px-6 text-left">Article Count</th>
                                <th className="py-3 px-6 text-center">Edit</th>
                                <th className="py-3 px-6 text-center">Delete</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {allCategories.map(category => (
                                <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-6">{category.name}</td>
                                    <td className="py-3 px-6">{category.articleCount}</td>
                                    <td className="py-3 px-6 text-center">
                                        <button
                                            onClick={() => handleEdit(category.id)}
                                            className="text-blue-500 hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="text-red-500 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal >
    );
};

export default CategoryModal;
