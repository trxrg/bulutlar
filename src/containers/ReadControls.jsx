import React, { useState, useEffect } from 'react';

const ReadControls = ({ tags }) => {

    return (
        <div className='overflow-auto bg-stone-50 shadow-md rounded-lg'>
            <div className='p-2'>
                <h3 className="text-xl font-semibold my-4">Tags</h3>
                <div className="flex flex-wrap">
                    {tags.map((tag, index) => (
                        <span key={index} className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">{tag.name}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReadControls;
