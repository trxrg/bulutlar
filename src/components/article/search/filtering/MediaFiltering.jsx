import React, { useContext } from 'react';
import Checkbox from '@mui/material/Checkbox';
import { AppContext } from '../../../../store/app-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';

const MediaFiltering = () => {
    const { translate: t } = useContext(AppContext);
    const {
        filterHasImages, setFilterHasImages,
        filterHasAudios, setFilterHasAudios,
        filterHasVideos, setFilterHasVideos,
    } = useContext(SearchContext);

    const checkboxSx = { color: 'var(--text-primary)' };

    return (
        <div className='flex flex-row flex-wrap p-3 gap-x-2' style={{ color: 'var(--text-primary)' }}>
            <label className='select-none cursor-pointer'>
                <Checkbox
                    checked={filterHasImages}
                    onChange={(e) => setFilterHasImages(e.target.checked)}
                    sx={checkboxSx}
                />
                {t('image')}
            </label>
            <label className='select-none cursor-pointer'>
                <Checkbox
                    checked={filterHasAudios}
                    onChange={(e) => setFilterHasAudios(e.target.checked)}
                    sx={checkboxSx}
                />
                {t('audio')}
            </label>
            <label className='select-none cursor-pointer'>
                <Checkbox
                    checked={filterHasVideos}
                    onChange={(e) => setFilterHasVideos(e.target.checked)}
                    sx={checkboxSx}
                />
                {t('video')}
            </label>
        </div>
    );
};

export default MediaFiltering;
