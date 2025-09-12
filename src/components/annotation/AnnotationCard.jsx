import React, { useContext } from 'react';
import { AppContext } from '../../store/app-context';

const AnnotationCard = ({ annotation, onClick }) => {

    const { translate: t } = useContext(AppContext);

    const handleClick = () => {
        onClick(annotation);
    }

    return (
        <div className="text-lg rounded-md border-4 transition duration-300 ease-in-out
        active:shadow-none p-5 shadow-xl cursor-pointer flex flex-col w-full overflow-hidden"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
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