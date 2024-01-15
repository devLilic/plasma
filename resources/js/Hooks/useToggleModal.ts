import {useState} from "react";



interface ToggleModalProps{
    modal: "NewArticle" | "ImageEditor"
}

const useToggleModal = (modal: ToggleModalProps) => {
    const [isOpen, setIsOpen] = useState(false)

    const toggleModal = () => setIsOpen(prevState => !prevState)

    return {isOpen, toggleModal}
}

export default useToggleModal;
