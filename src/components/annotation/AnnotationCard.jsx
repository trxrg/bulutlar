import React, { useContext } from 'react';
import { AppContext } from '../../store/app-context';

const AnnotationCard = ({ annotation, onClick }) => {

    const { translate: t } = useContext(AppContext);

    const handleClick = () => {
        onClick(annotation);
    }

    return (
        <div className="rounded-md bg-gray-100 hover:bg-white border-4 border-gray-300 hover:border-gray-500 transition duration-300 ease-in-out
        active:bg-gray-300 active:shadow-none p-5 shadow-xl cursor-pointer flex flex-col w-full overflow-hidden"
            onClick={handleClick}>
            {annotation &&
                <div>
                    <div style={{ whiteSpace: 'pre-line' }}>
                        {annotation.note}
                    </div>
                    <div className="text-sm text-gray-400 italic mt-2">
                        <div>                            
                            <div>{t('last update')}: {new Date(annotation.updatedAt).toLocaleDateString(t('locale'))}</div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};

export default AnnotationCard;