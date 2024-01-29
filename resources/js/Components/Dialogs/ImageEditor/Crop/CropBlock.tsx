import React, {useState, useRef, useEffect} from 'react'
import ReactCrop, {Crop, PercentCrop, PixelCrop} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {useTypedSelector} from "@/Hooks/useTypedSelector";
import {Button} from "@material-tailwind/react";
import {useActions} from "@/Hooks/useActions";

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

const CropBlock = () => {
    const cropImage = useTypedSelector(state => state.externalImages.selected)
    const {setCropSection, cropExternalImage} = useActions()

    const [crop, setCrop] = useState<Crop>({
        unit: "px",
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });
    const [percentCrop, setPercentCrop] = useState<PercentCrop>({
        unit: "%",
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });
    const img = useRef<HTMLImageElement | null>(null);
    const aspect = 16 / 9;

    // reset imageToCrop and set to new image when another image is selected
    useEffect(() => {
        setCrop({...defaultState.crop})
        setPercentCrop({...defaultState.percentCrop})
    }, [cropImage.url]);

    // useEffect(() => {
    //     if (imageToCrop.percentCrop.x !== 0 || imageToCrop.percentCrop.y !== 0 || imageToCrop.percentCrop.width !== 0 || imageToCrop.percentCrop.height) {
    //         handleCrop(imageToCrop.percentCrop)
    //     }
    // }, [imageToCrop.percentCrop.x, imageToCrop.percentCrop.y, imageToCrop.percentCrop.width, imageToCrop.percentCrop.height]);

    const handleImageLoad = () => {
        if (img.current) {
            const [width, height, percentWidth, percentHeight] = calculateSizes(img.current); // width and height in %
            setCrop(prevState => ({
                ...prevState,
                width,
                height
            }))
            setPercentCrop(prevState => ({
                ...prevState,
                width: percentWidth,
                height: percentHeight
            }))
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
        setPercentCrop(prevState => ({
            ...prevState,
            x: percentCrop.x,
            y: percentCrop.y,
            width: percentCrop.width > 100 ? 100 : percentCrop.width,
            height: percentCrop.height > 100 ? 100 : percentCrop.height
        }))
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

    const handleCropImageClick = () => {
        setCropSection(percentCrop)
        cropExternalImage(cropImage)
    }

    return (
        <div className='flex flex-col items-top justify-center'>
            <div>
                <ReactCrop crop={crop}
                           onChange={handleEditCropArea}
                           onComplete={handleEditCropArea}
                           aspect={aspect}>
                    <img src={cropImage.url}
                         ref={img}
                         onLoad={handleImageLoad}
                    />
                </ReactCrop>
                <div>
                    <Button placeholder={undefined}
                            size='sm'
                            onClick={handleCropImageClick}>Set</Button>
                </div>
                <div>
                    <p>x - {cropImage.cropSection.percentCrop.x}%</p>
                    <p>y - {cropImage.cropSection.percentCrop.y}%</p>
                    <p>width - {cropImage.cropSection.percentCrop.width}%</p>
                    <p>height - {cropImage.cropSection.percentCrop.height}%</p>
                </div>
            </div>
        </div>
    )
}

export default CropBlock;
