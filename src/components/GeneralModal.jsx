import Modal from 'react-modal';
import { XMarkIcon } from '@heroicons/react/24/solid'; // Import v2 icons

const GeneralModal = ({ isOpen, onClose, title, children }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed inset-0 bg-black bg-opacity-75"
        >
            <div className="relative flex flex-col bg-white p-5 rounded-sm shadow-lg max-w-[80vh] max-h-[60vh]">
                <div className='flex justify-between mb-3'>
                    <h2 className='text-lg text-gray-600 uppercase'>{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray p-1 rounded-full hover:bg-red-700 focus:outline-none transition-all duration-300 flex items-center justify-center"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {children}
            </div>
        </Modal >
    );
}

export default GeneralModal;