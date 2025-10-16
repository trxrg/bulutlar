import Modal from 'react-modal';
import { XMarkIcon } from '@heroicons/react/24/solid'; // Import v2 icons

const GeneralModal = ({ isOpen, onRequestClose, title, children, style }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            className="fixed inset-0 flex items-center justify-center p-4 z-50 focus:outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-50 focus:outline-none"
            shouldFocusAfterRender={false}
            shouldReturnFocusAfterClose={false}
        >
            <div 
                className="relative flex flex-col bg-white p-5 rounded-xl shadow-lg min-w-[50%] max-w-6xl z-50 focus:outline-none"
                style={style || { maxHeight: '60%' }}
            >
                <div className={'flex justify-between ' + (title && ' mb-8')}>
                    <h2 className='text-2xl text-gray-600 select-none font-semibold'>{title}</h2>
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