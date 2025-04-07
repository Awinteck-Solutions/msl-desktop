import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { verify } from "../../Services/UserApi";
import { Progress, useDisclosure } from '@chakra-ui/react'
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button } from '@chakra-ui/react';
import { updateAvailableCall } from "../../Services/ExtraApi";

const currentVersion = "1.2.1"
const SideBar = ({ dashboard, mycourse, course, feedback, help, logout }) => {
    const navigator = useNavigate();
    let user = localStorage.getItem('user')
    const [downloads, setDownloads] = useState({});
    const [updateAvailable, setUpdateAvailable] = useState({})

    const { isOpen, onOpen, onClose } = useDisclosure()

    const updateAvailableAPI = () => {

        updateAvailableCall().then((res) => {
            console.log('update available res', res.response.response)
            setUpdateAvailable(res.response.response)

            let updateAvailable = res.response.response

            if (updateAvailable.status) {
                console.log('updateAvailable.status',updateAvailable.status)
                if (updateAvailable.version !== currentVersion) {
                    console.log('updateAvailable.version == currentVersion',updateAvailable.version,currentVersion)
                  
                    // Open Update notification - prevent use of current version
                    onOpen()
                }
    
            } 

        }).catch((error) => {
            console.log('ERROR', error)
        })
    }

    const verifyDevice = () => {
        console.info('VERIFICATION CALLED')
        const payload = {
            "device_id": "e43c-5223c2-53c2-s456",
            "user_id": JSON.parse(user)?._id
        }
        console.log('payload', payload)
        verify(payload).then((res) => {
            console.table(res)
        }).catch((error) => {
            console.log('ERROR', error)
            navigator('/login')
        })
    }

    useEffect(() => {
        updateAvailableAPI()
 
            if (!user) {
                console.log('null user', user)
                navigator('/login')
            }
            else if (user !== null && user != undefined) {
                console.log('ALLOWED-LOGIN STILL')
                verifyDevice()


            } else {
                console.log('ALLOWED-LOGIN STILL NOT')
                navigator('/login')
            }
       

        // ===========================================================
        // Listen for progress updates
        window.electronAPI.receiveData('download-progress', (data) => {
            // console.log('download-progress :>> ',data );
            setDownloads((prev) => ({ ...prev, [data.filename]: data.progress }));
        });

        // Listen for download completion
        window.electronAPI.receiveData('download-complete', (data) => {
            // console.log('download-complete :>> ', data);
            setDownloads((prev) => ({ ...prev, [data.filename]: 100 })); // Mark as complete
        });

        // Listen for download failures
        window.electronAPI.receiveData('download-failed', (data) => {
            // console.log('download-failed :>> ', data.filename);
            setDownloads((prev) => ({ ...prev, [data.filename]: -1 })); // Mark as failed
        });
        // ===========================================================


    }, [])

    return <>
        <div className="border-r border-gray-100 h-full min-h-dvh bg-gray-50 relative ">
            <div className='p-10 text-center'>
                <img className=" object-fill w-28 m-auto" src="https://mslelearning.com/mslogo.png" alt="msl logo" />
                {/* <p className="text-[#22209C] font-bold text-3xl space-x-1">
                    <span className="border-2 border-[#22209C] px-2">M</span>
                    <span className="border-2 border-[#22209C] px-2">S</span>
                    <span className="border-2 border-[#22209C] px-2">L</span> </p>
                <p className="text-gray-400 font-bold text-[10px] text-center">BUSINESS SCHOOL </p> */}
            </div>


            <div>

                {Object.keys(downloads).length != 0 ? <p className="text-blue-700 text-sm font-bold px-4">Download</p> : ''}

                {Object.keys(downloads).map((filename, index) => (
                    <div className="p-2 px-4 mx-4 my-1 border rounded" key={index}>
                        <p className="text-[10px]">Download - {++index}</p>
                        {downloads[filename] === -1 ? (
                            <p className="text-sm text-red-500">Download Failed</p>
                        ) : (
                            <>
                                <Progress value={downloads[filename]} size='xs' colorScheme='green' />
                                <p className="text-[10px]">{downloads[filename]}%</p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="">
                <p className="p-2 text-sm text-gray-400 font-semibold">MAIN</p>
                <div>
                    <Link to={'/dashboard'} className={
                        dashboard ? "flex space-x-2 px-4 bg-blue-100 text-blue-900 font-medium p-3 border-b"
                            : "flex space-x-2 px-4 hover:bg-blue-100 hover:text-blue-900 text-gray-700 font-medium p-3 border-b"
                    }>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                            </svg>
                        </span>
                        <span>Dashboard</span>
                    </Link>
                </div>

                <div>
                    <Link to={'/personal/course'} className={
                        mycourse ? "flex space-x-2 px-4 bg-blue-100 text-blue-900 font-medium p-3 border-b"
                            : "flex space-x-2 px-4 hover:bg-blue-100 hover:text-blue-900 text-gray-700 font-medium p-3 border-b"
                    }>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                            </svg>
                        </span>
                        <span>My courses</span>
                    </Link>

                </div>

                <div>
                    <Link to={'/course'} className={
                        course ? "flex space-x-2 px-4 bg-blue-100 text-blue-900 font-medium p-3 border-b"
                            : "flex space-x-2 px-4 hover:bg-blue-100 hover:text-blue-900 text-gray-700 font-medium p-3 border-b"
                    }>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                            </svg>
                        </span>
                        <span>Courses</span>
                    </Link>
                </div>
            </div>

            <div className="mt-10">
                <p className="p-2 text-sm text-gray-400 font-semibold">GENERAL</p>
                <div>
                    <Link to={'/feedback'} className={
                        feedback ? "flex space-x-2 px-4 bg-blue-100 text-blue-900 font-medium p-3 border-b"
                            : "flex space-x-2 px-4 hover:bg-blue-100 hover:text-blue-900 text-gray-700 font-medium p-3 border-b"
                    }>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
                            </svg>
                        </span>
                        <span>Feedback</span>
                    </Link>
                </div>

                {/* <div>
                    <Link to={'/help'} className={
                        help ? "flex space-x-2 px-4 bg-blue-100 text-blue-900 font-medium p-3 border-b"
                            :"flex space-x-2 px-4 hover:bg-blue-100 hover:text-blue-900 text-gray-700 font-medium p-3 border-b"
                    }>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                            </svg>
                        </span>
                        <span>Help</span>
                    </Link>

                </div> */}

                <div>
                    <Link to={'/login'} className={
                        logout ? "flex space-x-2 px-4 bg-blue-100 text-blue-900 font-medium p-3 border-b"
                            : "flex space-x-2 px-4 hover:bg-blue-100 hover:text-blue-900 text-gray-700 font-medium p-3 border-b"
                    }>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </span>
                        <span>Logout</span>
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-0 w-full flex justify-center">
                <p className="text-center space-x-2">
                    Version {currentVersion}
                </p>
            </div>

            <UpdateModal 
            isOpen = {isOpen}
            onClose = {onClose}
             data={updateAvailable} />

        </div>
    </>
}

export default SideBar;


const UpdateModal = ({ isOpen, onClose, data }) => {
    return (
        <Modal isOpen={isOpen} onClose={data.enforce? ()=>{} : onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>New Update Available (v{data.version})</ModalHeader>
                {data.enforce ? "" : <ModalCloseButton/>}
                <ModalBody>
                    A new version of the app is available. Would you like to update now?
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" ml={3} onClick={() => {
                        // onClose();
                        console.log('data.mainLink', data.mainLink)
                        window.electronAPI.sendData('update-available', data.mainLink);
                    }}>
                        Update Now (nsis)
                    </Button>
                    <Button colorScheme="green" ml={3} onClick={() => {
                        // onClose();
                        window.electronAPI.sendData('update-available', data.exeLink);
                    }}>
                        Update Now (exe)
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

