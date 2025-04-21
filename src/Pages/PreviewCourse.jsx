import SideBar from "../Components/General/SideBar";
import { useEffect, useState } from "react";
import apiEndpoints from "../Services/apiConfig";
import {
    Accordion,
    AccordionItem,
    AccordionButton, Divider,
    AccordionPanel, Box,
    AccordionIcon, Spinner,
} from '@chakra-ui/react'
import { useNavigate, useParams } from "react-router-dom";
import { singleCourse } from "../Services/CourseApi";


const PreviewCourse = () => {
    let { id } = useParams()
    console.log('id', id)
    const [data, setData] = useState({});
    const navigator = useNavigate()
    const [refresh, setRefresh] = useState(false)


    const [downloadedList, setDownloadedList] = useState([])


    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState(true)
    const [playVideo, setPlayVideo] = useState(null)

    const [selectedPdf, setSelectedPdf] = useState(null)
    const [selectedVideo, setSelectedVideo] = useState({
        "video": null,
        "video1": null,
        "video2": null,
        "video3": null,
        "video4": null,
        "video5": null,
        "video6": null,
        "video7": null,
        "video8": null,
        "pdf": null,
        "pdf1": null,
        "pdf2": null,
        "pdf3": null,
        "pdf4": null,
        "pdf5": null,
        "pdf6": null,
        "pdf7": null,
        "pdf8": null,
    })
    const [downloaded, setDownloaded] = useState({
        "video": false,
        "video2": false,
        "video1": false,
        "video3": false,
        "video4": false,
        "video5": null,
        "video6": null,
        "video7": null,
        "video8": null,
        "pdf": false,
        "pdf1": false,
        "pdf2": false,
        "pdf3": false,
        "pdf4": false,
        "pdf5": null,
        "pdf6": null,
        "pdf7": null,
        "pdf8": null,
    })

    // ---------------------API CALLS--------------------------//

    const previewCourseCall = () => {
        singleCourse(id).then((response) => {

            console.log('previewCourseCall response :>> ', response.response.response);

            let data = response.response.response
            data.lessons = data.lessons.sort((a, b) => {
                const positionA = a.linkedCourses.find(lc => lc.course === id)?.position || Number.MAX_VALUE;
                const positionB = b.linkedCourses.find(lc => lc.course === id)?.position || Number.MAX_VALUE;
                return positionA - positionB;
            }
            )

            console.log('FORMATED', data.lessons)
            setData(data);
            setIsLoading(false)
        }).catch((error) => {
            console.log('previewCourseCall error :>> ', error);
            setIsLoading(false)
        })
    }

    // ---------------------API CALLS--------------------------//

    useEffect(() => {
        previewCourseCall()

        window.electronAPI.sendData('getDownloadedList', null);

        window.electronAPI.receiveData('downloadedList', (receivedData) => {
            console.log('downloadedList', receivedData);
            setDownloadedList(receivedData)
        });


        window.electronAPI.receiveData('delete-complete', (data) => {
            setRefresh(!refresh)
        });

        window.electronAPI.receiveData('download-complete', (data) => {
            setRefresh(!refresh)
        });


    }, [refresh])

    const VideoItem = ({ link, number, downloaded = false, selected = false }) => {


        const onTap = () => {
            const videoKey = `video${number > 1 ? number - 1 : ''}`;  // video, video1, video2...
            console.log(link);

            const handleVideo = (decryptedData) => {
                // selectedVideo[videoKey] = decryptedData;
                setPlayVideo(decryptedData);
                // navigator('/'); 
            };

            if (downloaded) {
                console.log('------------------INTERCEPT URL VIDEO::-------------------');
                window.electronAPI.sendData('decrypt', link);
                window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                    console.log('getDecrypt!!! video', receivedData);
                    handleVideo(receivedData);
                });
            } else {
                // selectedVideo[videoKey] = link;
                setPlayVideo(`https://mslbucket.s3.us-east-1.amazonaws.com/${link}`);
            }

            // setSelectedVideo(selectedVideo);
        };


        const onTaplater = () => {
            switch (number) {
                case 1:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL VIDEO-------------------')
                        console.log('selectedVideo.video :>> ', link);
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt later', (receivedData) => {
                            console.log('getDecrypt', receivedData);
                            selectedVideo.video = receivedData
                            setPlayVideo(receivedData)
                        });
                    }
                    else {
                        selectedVideo.video = link;
                        setPlayVideo(`https://mslbucket.s3.us-east-1.amazonaws.com/${link}`)
                    }

                    break;
                case 2:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL VIDEO-------------------')
                        console.log('selectedVideo.video :>> ', link);
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                            console.log('getDecrypt', receivedData);
                            selectedVideo.video1 = receivedData
                            setPlayVideo(receivedData)
                        });
                    }
                    else {
                        selectedVideo.video = link;
                        setPlayVideo(`https://mslbucket.s3.us-east-1.amazonaws.com/${link}`)
                    }
                    break;
                case 3:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL VIDEO-------------------')
                        console.log('selectedVideo.video :>> ', link);
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                            console.log('getDecrypt', receivedData);
                            selectedVideo.video2 = receivedData
                            setPlayVideo(receivedData)
                        });
                    }
                    else {
                        selectedVideo.video = link;
                        setPlayVideo(`https://mslbucket.s3.us-east-1.amazonaws.com/${link}`)
                    }
                    break;
                case 4:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL VIDEO-------------------')
                        console.log('selectedVideo.video :>> ', link);
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                            console.log('getDecrypt', receivedData);
                            selectedVideo.video3 = receivedData
                            setPlayVideo(receivedData)
                        });
                    }
                    else {
                        selectedVideo.video = link;
                        setPlayVideo(`https://mslbucket.s3.us-east-1.amazonaws.com/${link}`)
                    }
                    break;
                case 5:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL VIDEO-------------------')
                        console.log('selectedVideo.video :>> ', link);
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                            console.log('getDecrypt', receivedData);
                            selectedVideo.video4 = receivedData
                            setPlayVideo(receivedData)
                        });
                    }
                    else {
                        selectedVideo.video = link;
                        setPlayVideo(`https://mslbucket.s3.us-east-1.amazonaws.com/${link}`)
                    }
                    break;
                default:
                    console.log('default')
                    break;
            }
            setSelectedVideo(selectedVideo)

        }


        return <>
            <div className={selected ? 'cursor-pointer bg-blue-400 duration-300 my-1' : 'cursor-pointer bg-gray-50 hover:bg-gray-100 duration-300 my-1'}>
                <div>
                    <div className={'flex  space-x-1 items-center justify-between text-[12px] bg-gray-200 rounded'}>
                        <div
                            onClick={() => {
                                console.log('video player')
                                onTap()
                            }}
                            className="flex items-center space-x-1 h-full w-full p-3 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>

                            <span className=''>Play lesson {number}</span>

                        </div>

                        <div className="p-3">
                            {!downloaded ?
                                <span className=""
                                    onClick={() => {
                                        window.electronAPI.sendData('download',
                                            {
                                                url: `https://mslbucket.s3.us-east-1.amazonaws.com/${link}`,
                                                filename: link?.split('/')[1]
                                            })

                                    }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </span>
                                :
                                <div className="flex space-x-1">
                                    <span className="text-green-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                        </svg>
                                    </span>

                                    <span className="text-red-400 hover:text-red-600"
                                        onClick={() => {
                                            window.electronAPI.sendData('delete-download',
                                                { filename: link?.split('/')[1] })
                                        }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </span>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    }

    const PdfItem = ({ link, number, downloaded = false, selected = false }) => {
        const onTap = () => {
            if (downloaded) {
                console.log('------------------INTERCEPT URL PDF-------------------')
                window.electronAPI.sendData('decrypt-pdf', link)
                window.electronAPI.receiveData('getDecrypt-pdf', (receivedData) => {
                    console.log('getDecrypt pdf 1', receivedData); 
                    navigator(`/preview/pdf/${id}`, { state:{data:receivedData, online:false}, type: 'pdf' });
                });
                console.log('~~DOWNLOADED...', number)
            }
            else {
                console.log('NOT DOWNLOADED...', number)
                navigator(`/preview/pdf/${id}`, { state: {data:link, online:true}, type: 'pdf' }); 
            }
        }

        const onTapOld = () => {
            switch (number) {
                case 1:
                    console.log(link);

                    if (downloaded) {
                        console.log('------------------INTERCEPT URL PDF-------------------')
                        window.electronAPI.sendData('decrypt-pdf', link)
                        window.electronAPI.receiveData('getDecrypt-pdf', (receivedData) => {
                            console.log('getDecrypt pdf 1', receivedData);
                            selectedVideo.pdf = receivedData
                            navigator(`/preview/pdf/${id}`, { state:{data:receivedData, online:false}, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                        navigator(`/preview/pdf/${id}`, { state: {data:link, online:true}, type: 'pdf' });
                        selectedVideo.pdf = link;
                    }
                    break;
                case 2:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL PDF-------------------')
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                            console.log('getDecrypt pdf 2', receivedData);
                            selectedVideo.pdf1 = receivedData
                            navigator(`/preview/pdf/${id}`, { state:{data:receivedData, online:false}, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                        navigator(`/preview/pdf/${id}`, { state:{data:receivedData, online:false}, type: 'pdf' });
                        selectedVideo.pdf1 = link;
                    }
                    break;
                case 3:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL PDF-------------------')
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                            console.log('getDecrypt pdf 3', receivedData);
                            selectedVideo.pdf2 = receivedData
                            navigator(`/preview/pdf/${id}`, { state:{data:receivedData, online:false}, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                         navigator(`/preview/pdf/${id}`, { state: {data:link, online:true}, type: 'pdf' });
                        selectedVideo.pdf2 = link;
                    }
                    break;
                case 4:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL PDF-------------------')
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                            console.log('getDecrypt pdf 4', receivedData);
                            selectedVideo.pdf3 = receivedData
                            navigator(`/preview/pdf/${id}`, { state:{data:receivedData, online:false}, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                         navigator(`/preview/pdf/${id}`, { state: {data:link, online:true}, type: 'pdf' });
                        selectedVideo.pdf3 = link;
                    }
                    break;
                case 5:
                    console.log(link);
                    if (downloaded) {
                        console.log('------------------INTERCEPT URL PDF-------------------')
                        window.electronAPI.sendData('decrypt', link)
                        window.electronAPI.receiveData('getDecrypt', (receivedData) => {
                            console.log('getDecrypt pdf 5', receivedData);
                            selectedVideo.pdf4 = receivedData
                            navigator(`/preview/pdf/${id}`, { state:{data:receivedData, online:false}, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                         navigator(`/preview/pdf/${id}`, { state: {data:link, online:true}, type: 'pdf' });
                        selectedVideo.pdf4 = link;
                    }
                    break;
                default:
                    console.log('NOT DOWNLOADED...')
                    console.log('default')
                    break;
            }
            console.log('link :>> ', link);
            // navigator('/preview/pdf', { state: link});
            setSelectedVideo(selectedVideo)
        }


        return <>
            <div className='cursor-pointer bg-gray-50 text-[12px] hover:bg-gray-100 duration-300'>
                <div

                >
                    <div className={'flex  space-x-1 items-center justify-between text-[12px] bg-gray-200 rounded'}>
                        <div
                            onClick={() => {
                                onTap()
                            }}
                            className="flex items-center space-x-1 h-full w-full p-3 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>


                            <span className=''>Read Lesson Slide {number}</span>

                        </div>
                        <div className="p-3">
                            {!downloaded ?
                                <span className=""
                                    onClick={() => {
                                        window.electronAPI.sendData('download',
                                            {
                                                url: `https://mslbucket.s3.us-east-1.amazonaws.com/${link}`,
                                                filename: link?.split('/')[1]
                                            })


                                    }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </span>
                                :
                                <div className="flex space-x-1">
                                    <span className="text-green-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                        </svg>
                                    </span>

                                    <span className="text-red-400 hover:text-red-600"
                                        onClick={() => {
                                            window.electronAPI.sendData('delete-download',
                                                { filename: link?.split('/')[1] })
                                        }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </span>


                                </div>
                            }
                        </div>
                    </div>

                </div>
            </div>
        </>
    }



    const isDownloadedFunc = (variable) => {
        return downloadedList.filter((value) => {
            let arg = value?.split('.')
            let filename = `${arg[0]}.${arg[1]}`
            let newVar = variable?.split('/')[1]
            if (filename == newVar) return true
            else false
        }).length == 0 ? false : true
    }



    return <>
        <div className="flex gap-1 ">
            <div className="min-w-[300px]">
                <SideBar mycourse={true} />
            </div>

            {isLoading ?
                <div className="text-center m-auto">
                    <Spinner size='xl'
                        thickness='4px'
                        speed='0.65s'
                        emptyColor='gray.200'
                        color='blue.500'
                    />
                </div>
                :
                <div className="w-full bg-gray-50">

                    {/* Heading */}
                    <div className="m-2 mt-4">
                        <div className="flex justify-between">
                            <h1 className="text-xl font-bold ml-1 truncate max-w-[600px]">{data?.title}</h1>
                        </div>
                    </div>

                    {/* Main Body */}
                    <div className="mx-3">
                        {!playVideo ?
                            <div className="h-[500px] border-4 border-grey-400 bg-black">
                                <img className="object-cover object-center w-full h-full" src={`https://api.mslelearning.com/${data?.thumbnail}`}
                                    alt={`https://api.mslelearning.com/${data?.thumbnail}`} />
                            </div>
                            :
                            <video
                                className="bg-green-400 w-full"
                                controls
                                controlsList="nodownload"
                                src={`${playVideo}`}>
                            </video>
                        }



                        <div>
                            <div className='lg:grid lg:grid-cols-12'>
                                <div className='lg:col-span-7'>
                                    <div>
                                        <div className='mx-2'>
                                            <p className='text-2xl font-bold my-3'>About this course</p>
                                            <p>{data?.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className='lg:col-span-5 bg-gray-50 lg:py-0 py-4 overflow-y-auto h-[45em]'>
                                    <p className='text-xl font-bold lg:text-center mx-3 lg:mx-0 my-3'>Course Content</p>
                                    <Divider></Divider>
                                    <div className='px-4'>
                                        <Accordion>
                                            {data?.lessons?.length == 0 ?
                                                <div className="text-lg font-semibold text-center my-2 text-gray-500">
                                                    <p>Not Available</p>
                                                </div>

                                                : ''}

                                            {data?.lessons?.map((item, id) => {
                                                return <AccordionItem key={id}>
                                                    <h2>
                                                        <AccordionButton>
                                                            <Box as='span' flex='1' textAlign='left'>
                                                                <p className='text-[12px]'> {item?.title} </p>
                                                            </Box>
                                                            <AccordionIcon />
                                                        </AccordionButton>
                                                    </h2>
                                                    <AccordionPanel pb={4}>
                                                        <div>
                                                            {item?.video != null ?

                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={1}
                                                                        downloaded={isDownloadedFunc(item?.video)}
                                                                        link={item?.video} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item?.video1 != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={2}
                                                                        downloaded={isDownloadedFunc(item?.video1)}
                                                                        link={item?.video1} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item?.video2 != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={3}
                                                                        downloaded={isDownloadedFunc(item?.video2)}
                                                                        link={item?.video2} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item.video3 != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={4}
                                                                        downloaded={isDownloadedFunc(item?.vide3)}
                                                                        link={item?.video3} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item?.video4 != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={5}
                                                                        downloaded={isDownloadedFunc(item?.video4)}
                                                                        link={item?.video4} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item?.video5 != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={6}
                                                                        downloaded={isDownloadedFunc(item?.video5)}
                                                                        link={item?.video5} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item?.video6 != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={7}
                                                                        downloaded={isDownloadedFunc(item?.video6)}
                                                                        link={item?.video6} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item?.video7 != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={8}
                                                                        downloaded={isDownloadedFunc(item?.video7)}
                                                                        link={item?.video7} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item?.video8 != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        selected={false}
                                                                        number={9}
                                                                        downloaded={isDownloadedFunc(item?.video8)}
                                                                        link={item?.video8} />
                                                                </div>
                                                                : ''}

                                                        </div>
                                                        <div>
                                                            {item?.pdf != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={1}
                                                                        downloaded={isDownloadedFunc(item?.pdf)}
                                                                        link={item?.pdf} />
                                                                </div>
                                                                : ''}
                                                        </div>

                                                        <div>
                                                            {item?.pdf1 != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={2}
                                                                        downloaded={isDownloadedFunc(item?.pdf1)}
                                                                        link={item?.pdf1} />
                                                                </div>
                                                                : ''}
                                                        </div>

                                                        <div>
                                                            {item?.pdf2 != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={3}
                                                                        downloaded={isDownloadedFunc(item?.pdf2)}
                                                                        link={item?.pdf2} />
                                                                </div>
                                                                : ''}
                                                        </div>

                                                        <div>
                                                            {item?.pdf3 != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={4}
                                                                        downloaded={isDownloadedFunc(item?.pdf3)}
                                                                        link={item?.pdf3} />
                                                                </div>
                                                                : ''}
                                                        </div>

                                                        <div>
                                                            {item?.pdf4 != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={5}
                                                                        downloaded={isDownloadedFunc(item?.pdf4)}
                                                                        link={item?.pdf4} />
                                                                </div>
                                                                : ''}
                                                        </div>
                                                        <div>
                                                            {item?.pdf5 != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={6}
                                                                        downloaded={isDownloadedFunc(item?.pdf5)}
                                                                        link={item?.pdf5} />
                                                                </div>
                                                                : ''}
                                                        </div>
                                                        <div>
                                                            {item?.pdf6 != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={7}
                                                                        downloaded={isDownloadedFunc(item?.pdf6)}
                                                                        link={item?.pdf6} />
                                                                </div>
                                                                : ''}
                                                        </div>
                                                        <div>
                                                            {item?.pdf7 != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={8}
                                                                        downloaded={isDownloadedFunc(item?.pdf7)}
                                                                        link={item?.pdf7} />
                                                                </div>
                                                                : ''}
                                                        </div>
                                                        <div>
                                                            {item?.pdf8 != null ?
                                                                <div>
                                                                    <PdfItem
                                                                        selected={false}
                                                                        number={9}
                                                                        downloaded={isDownloadedFunc(item?.pdf8)}
                                                                        link={item?.pdf8} />
                                                                </div>
                                                                : ''}
                                                        </div>

                                                    </AccordionPanel>
                                                </AccordionItem>
                                            })}
                                        </Accordion>



                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>


                </div>
            }

        </div>
    </>


}

export default PreviewCourse;


