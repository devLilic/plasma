import React, {useRef, useState} from 'react';
import ReactCrop, {Crop, PercentCrop, PixelCrop} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface CropBlockProps {
    url: string;
    handlePercentCropChange: (percentCrop: PercentCrop) => void;
    maxHeight?: string;
}

const defaultCrop: Crop = {unit: 'px', x: 0, y: 0, width: 0, height: 0};
const defaultPercentCrop: PercentCrop = {unit: '%', x: 0, y: 0, width: 0, height: 0};

export default function CropBlock({url, handlePercentCropChange, maxHeight}: CropBlockProps) {
    const [crop, setCrop] = useState<Crop>(defaultCrop);
    const imageRef = useRef<HTMLImageElement>(null);
    const aspect = 16 / 9;

    const handleImageLoad = () => {
        if (!imageRef.current) return;
        let height = imageRef.current.clientHeight;
        let width = Math.floor(height * aspect);
        if (width > imageRef.current.clientWidth) {
            width = imageRef.current.clientWidth;
            height = Math.floor(width / aspect);
        }
        setCrop({...defaultCrop, width, height});
        handlePercentCropChange({...defaultPercentCrop, width: width / imageRef.current.clientWidth * 100, height: height / imageRef.current.clientHeight * 100});
    };

    const handleCropChange = (nextCrop: PixelCrop, percentCrop: PercentCrop) => {
        setCrop({...nextCrop, x: Math.floor(Math.abs(nextCrop.x)), y: Math.floor(Math.abs(nextCrop.y)), width: Math.floor(nextCrop.width), height: Math.floor(nextCrop.height)});
        handlePercentCropChange({...defaultPercentCrop, x: percentCrop.x, y: percentCrop.y, width: Math.min(100, Math.max(0, percentCrop.width)), height: Math.min(100, Math.max(0, percentCrop.height))});
    };

    return (
        <div className="flex w-full items-start justify-center overflow-hidden rounded-2xl" style={{maxHeight}}>
            <ReactCrop crop={crop} onChange={handleCropChange} onComplete={handleCropChange} aspect={aspect}>
                <img src={url} ref={imageRef} onLoad={handleImageLoad} style={{display: 'block', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight, objectFit: 'contain'}}/>
            </ReactCrop>
        </div>
    );
}
