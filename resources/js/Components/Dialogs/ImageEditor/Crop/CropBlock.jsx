import React, {useState, useRef, useEffect} from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {canvasPreview} from './CanvasPreview'
import {Button} from "@material-tailwind/react";
import imagesProvider from "@/Store/LocalImagesStore/ImagesProvider";

const defaultState = {
    img: '',
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

const CropBlock = ({image, handleCrop}) => {
    const [imageToCrop, setImageToCrop] = useState({
        ...defaultState,
        img: image.url,
    });
    const img = useRef();
    const aspect = 16 / 9;

    // reset imageToCrop and set to new image when another image is selected
    useEffect(() => {
        setImageToCrop({
            ...defaultState,
            img: image.url
        })
    }, [image.url]);

    useEffect(()=>{
        if(imageToCrop.percentCrop.x !== 0 || imageToCrop.percentCrop.y !== 0 || imageToCrop.percentCrop.width !== 0 || imageToCrop.percentCrop.height){
            handleCrop(imageToCrop.percentCrop)
        }
    }, [imageToCrop.percentCrop.x, imageToCrop.percentCrop.y, imageToCrop.percentCrop.width, imageToCrop.percentCrop.height]);

    const handleImageLoad = () => {
        const [width, height, percentWidth, percentHeight] = calculateSizes(); // width and height in %
        setImageToCrop(prevState => ({
            ...prevState,
            crop: {
                ...prevState.crop,
                width,
                height
            },
            percentCrop: {
                ...prevState.percentCrop,
                width: percentWidth,
                height: percentHeight
            }
        }))
    }

    // handle drag or move Crop selection
    const handleEditCropArea = (crop, percentCrop) => {
        setImageToCrop(prevState => ({
            ...prevState,
            crop: {
                unit: 'px',
                x: Math.floor(Math.abs(crop.x)),
                y: Math.floor(Math.abs(crop.y)),
                width: Math.floor(crop.width),
                height: Math.floor(crop.height)
            },
            percentCrop: {
                unit: '%',
                x: percentCrop.x,
                y: percentCrop.y,
                width: percentCrop.width > 100 ? 100 : percentCrop.width,
                height: percentCrop.height > 100 ? 100 : percentCrop.height
            }
        }))
    }

    const calculateSizes = () => {
        let height = img.current.clientHeight
        let width = Math.floor(height * 16 / 9);

        if (width > img.current.clientWidth) {
            width = img.current.clientWidth;
            height = Math.floor(width * 9 / 16);
        }
        let percentWidth = width / img.current.clientWidth * 100;
        let percentHeight = height / img.current.clientHeight * 100;

        return [width, height, percentWidth, percentHeight];
    }

    return (
        <div className='flex flex-col items-top justify-center'>
            <div>
                <ReactCrop crop={imageToCrop.crop}
                           onChange={handleEditCropArea}
                           onComplete={handleEditCropArea}
                           aspect={aspect}>
                    <img src={imageToCrop.img}
                         ref={img}
                         onLoad={handleImageLoad}
                    />
                </ReactCrop>
            </div>
        </div>
    )
}

export default CropBlock;
