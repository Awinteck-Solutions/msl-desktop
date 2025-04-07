import { generateQRCode, windowsLogin } from "../Services/UserApi"
import { Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton, Spinner, 
    useDisclosure} from "@chakra-ui/react"
import { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigator = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure()

    const [isLoading, setIsLoading] = useState(false)
    const [code, setCode] = useState();

    let payload = {
        "device_id": "e43c-5223c2-53c2-s456",
        "device_name": "Dell X laptop",
        "device_meta": "Windows 11, other device info"
    }

    let genCode = () => {
        setIsLoading(true)
        console.log('payload :>> ', payload);
        generateQRCode(payload).then((res) => {
            setIsLoading(false)
            let data = res.response.response
            console.log('res :>> ', data);
            setCode(data)
            onOpen()

            let looper = setInterval(() => {
                console.log('data._id :>> ', data._id);
                windowsLogin(data._id).then((response) => {
                    console.log('windows-login-response :>> ', response);
                    if (response.status) {
                        let user = response.response.response;
                        console.log('response :>> ', user);
                        localStorage.setItem('user', JSON.stringify(user))
                        
                        clearInterval(looper)

                        navigator('/')
                    }
                })
            }, [1000])

        }).catch((error) => {
            console.log('previewCourseCall error :>> ', error);
            setIsLoading(false)
        })
    }

    useEffect(() => {
        localStorage.setItem('user', null)
    },[])

    return(
        <div>

            {isLoading ?
                <div className="text-center mt-20 m-auto">
                    <Spinner size='xl'
                        thickness='4px'
                        speed='0.65s'
                        emptyColor='gray.200'
                            color='blue.500'
                        />
                </div>
                :
            <div className="md:grid md:gap-1 md:w-3/5 max-w-[400px]  bg-gray-100 p-1 rounded-2xl mx-auto my-10">
                
                <div className='p-10 bg-white rounded-xl text-center border'>
                <div className='p-10 text-center'>
                <img className=" object-fill w-28 m-auto" src="https://mslelearning.com/mslogo.png" alt="msl logo" />
                    {/* <p className="text-[#22209C] font-bold text-3xl space-x-1">
                        <span className="border-2 border-[#22209C] px-2">M</span>
                        <span className="border-2 border-[#22209C] px-2">S</span>
                        <span className="border-2 border-[#22209C] px-2">L</span> </p>
                    <p className="text-gray-400 font-bold text-[10px] text-center">BUSINESS SCHOOL </p> */}
                </div>
                    <div className="text-left space-y-2">
                        <p className='font-bold text-center text-lg'>Welcome back!</p>
                       
                        <ol type="numberic" className="text-left text-sm">
                            <li> 1. Open your mobile app</li>
                            <li> 2. Visit Menu tab </li>
                            <li> 3. Click Windows App Login</li>
                            <li> 4. Scan the Generated Code to Login</li>
                        </ol>
                    
                    </div>
                        <button
                            onClick={()=>genCode()}
                            className="bg-blue-700 hover:bg-blue-800 duration-200 w-full p-2 mt-6 rounded text-white"> Login </button>
                </div>
                <p className="text-center text-red-600 text-sm font-bold">NB:You require the mobile app to login</p>
                </div>         
            }
    <div>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Scan with your Mobile App</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
                {/* <p className="text-center">{code?.code}</p> */}
                <div className="m-auto my-10 w-fit bg-red-400 text-center" >
                    <QRCodeSVG value={code?.code} />     
                </div>
          </ModalBody>
         
        </ModalContent>
      </Modal>
    </div>

        </div>
    )
}
export default Login