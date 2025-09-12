import React, { useContext } from 'react';
import { AppContext } from '../../store/app-context';

const AnnotationCard = ({ annotation, onClick }) => {

    const { translate: t } = useContext(AppContext);

    const handleClick = () => {
        onClick(annotation);
    }

    return (
        <div className="text-lg rounded-md border-4 annotation-card
        active:shadow-none p-5 shadow-xl cursor-pointer flex flex-col w-full overflow-hidden"
            style={{
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)'
            }}
            onClick={handleClick}>
            {annotation &&
                <div>
                    <div style={{ whiteSpace: 'pre-line' }}>
                        {annotation.note}
                    </div>
                    <div className="text-sm italic mt-2" style={{ color: 'var(--text-tertiary)' }}>
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