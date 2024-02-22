import React, {useState, useRef, useEffect} from 'react'
import ReactCrop, {Crop, PercentCrop, PixelCrop} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {useActions} from "@/Hooks/useActions";

interface CropBlockProps {
    url: string
    handlePercentCropChange: (percentCrop: PercentCrop) => void
}

const defaultState: { crop: Crop, percentCrop: PercentCrop } = {
    crop: {
        unit: 'px',
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },
    percentCrop: {
        unit: '%',
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }
}

const CropBlock = ({url, handlePercentCropChange}: CropBlockProps) => {
    const [crop, setCrop] = useState<Crop>({
        unit: "px",
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });
    const img = useRef<HTMLImageElement | null>(null);
    const aspect = 16 / 9;

    const handleImageLoad = () => {
        if (img.current) {
            const [
                width,
                height,
                percentWidth,
                percentHeight
            ] = calculateSizes(img.current); // width and height in %
            setCrop(() => ({
                ...defaultState.crop,
                width,
                height
            }))
            handlePercentCropChange({
                ...defaultState.percentCrop,
                width: percentWidth,
                height: percentHeight
            })
        }
    }

    // handle drag or move Crop selection
    const handleEditCropArea = (crop: PixelCrop, percentCrop: PercentCrop) => {
        setCrop(prevState => ({
            ...prevState,
            x: Math.floor(Math.abs(crop.x)),
            y: Math.floor(Math.abs(crop.y)),
            width: Math.floor(crop.width),
            height: Math.floor(crop.height)
        }))

        handlePercentCropChange({
            ...defaultState.percentCrop,
            x: percentCrop.x,
            y: percentCrop.y,
            width: percentCrop.width < 0 ? 0 : (percentCrop.width > 100 ? 100 : percentCrop.width),
            height: percentCrop.height < 0 ? 0 : (percentCrop.height > 100 ? 100 : percentCrop.height)
        })
    }

    const calculateSizes = (image: HTMLImageElement) => {
        let height = image.clientHeight
        let width = Math.floor(height * 16 / 9);

        if (width > image.clientWidth) {
            width = image.clientWidth;
            height = Math.floor(width * 9 / 16);
        }
        let percentWidth = width / image.clientWidth * 100;
        let percentHeight = height / image.clientHeight * 100;

        return [width, height, percentWidth, percentHeight];
    }

    return (
        <div className='flex flex-col items-top justify-center'>
            <div>
                <ReactCrop crop={crop}
                           onChange={handleEditCropArea}
                           onComplete={handleEditCropArea}
                           aspect={aspect}>
                    <img src={url}
                         ref={img}
                         onLoad={handleImageLoad}
                    />
                </ReactCrop>

            </div>
        </div>
    )
}

export default CropBlock;
