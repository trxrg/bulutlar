import Modal from 'react-modal';
import { XMarkIcon } from '@heroicons/react/24/solid'; // Import v2 icons

const GeneralModal = ({ isOpen, onRequestClose, title, children }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-50"
        >
            <div className="relative flex flex-col bg-white p-5 rounded-xl shadow-lg min-w-[50%] max-w-6xl max-h-[60%] z-50">
                <div className={'flex justify-between ' + (title && ' mb-8')}>
                    <h2 className='text-2xl text-gray-600 select-none'>{title}</h2>
                    <button
                        onClick={onRequestClose}
                        className="text-gray p-1 rounded-full hover:bg-gray-400 focus:outline-none transition-all duration-300 flex items-center justify-center"
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