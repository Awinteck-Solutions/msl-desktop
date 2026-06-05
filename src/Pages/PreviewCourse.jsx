import SideBar from "../Components/General/SideBar";
import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../Services/apiConfig";
import { getStoredUser } from "../Services/session";
import {
    Accordion,
    AccordionItem,
    AccordionButton, Divider,
    AccordionPanel, Box,
    AccordionIcon, Spinner, useToast,
} from '@chakra-ui/react'
import { useNavigate, useParams, Link } from "react-router-dom";
import {
    BookOpen,
    Check,
    ChevronLeft,
    FileText,
    Lock,
    PlayCircle,
    ShieldCheck,
    Smartphone,
} from "lucide-react";
import { singleCourse, fetchEnrolledCourseIds } from "../Services/CourseApi";
import { verify } from "../Services/UserApi";
import { useMslAi } from "../Context/MslAiContext";
import { normalizeS3Key } from "../utils/s3Key";
import {
    isLessonFullyVisited,
    isResourceVisited,
    markResourceVisited,
} from "../utils/courseVisitProgress";


const PreviewCourse = () => {
    let { id } = useParams()
    console.log('id', id)
    let user = localStorage.getItem('user')

    const [data, setData] = useState({});
    const [lessons, setLessons] = useState([]);
    const navigator = useNavigate()
    const toast = useToast()
    const [refresh, setRefresh] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)
    const { setAiScope } = useMslAi()
    const initialCourseScopeSet = useRef(false)

    const verifyDevice = () => {
        verify().then((res) => {
            if (!res.status) navigator('/login');
        }).catch(() => navigator('/login'));
    }

    const [downloadedList, setDownloadedList] = useState([])


    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState(true)
    const [playVideo, setPlayVideo] = useState(null)
    const [courseTab, setCourseTab] = useState("overview")
    const [visitTick, setVisitTick] = useState(0)

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

            // console.log('previewCourseCall response :>> ', response.response.response);

            let data = response.response.response
            const courseIdStr = String(id);
            const sortedLessons = (data.lessons || []).map((lesson) => {
                const linkedCourse = lesson.linkedCourses?.find(
                    (lc) => String(lc.course?._id ?? lc.course) === courseIdStr
                );
                const position = linkedCourse ? linkedCourse.position : Number.MAX_VALUE;
                return { ...lesson, position };
            }).sort((a, b) => a.position - b.position)
                .map(lesson => { const { position, ...rest } = lesson; return rest; });

            console.log('FORMATED', sortedLessons)
            setData(data);
            setLessons(sortedLessons);
            setIsLoading(false)
        }).catch((error) => {
            console.log('previewCourseCall error :>> ', error);
            setIsLoading(false)
        })
    }

    // ---------------------API CALLS--------------------------//

    useEffect(() => {
        if (!getStoredUser()?.token) {
            navigator('/login');
            return;
        }
        previewCourseCall()
        fetchEnrolledCourseIds()
            .then((ids) => setIsEnrolled(ids.has(String(id))))
            .catch(() => setIsEnrolled(false));

        window.electronAPI.sendData('getDownloadedList', null);

        window.electronAPI.receiveData('downloadedList', (receivedData) => {
            // console.log('downloadedList', receivedData);
            setDownloadedList(receivedData)
        });


        window.electronAPI.receiveData('delete-complete', (data) => {
            setRefresh(!refresh)
            window.electronAPI.sendData('count-encrypted-files', 'count-encrypted-files');
        });

        window.electronAPI.receiveData('download-complete', (data) => {
            setRefresh(!refresh)
            console.log('download-complete', data);
            window.electronAPI.sendData('count-encrypted-files', 'count-encrypted-files');
        });
    }, [refresh])

    useEffect(() => {
        initialCourseScopeSet.current = false;
    }, [id]);

    useEffect(() => {
        if (!isEnrolled || !data.title || initialCourseScopeSet.current) return;
        initialCourseScopeSet.current = true;
        setAiScope({
            courseId: String(id),
            label: data.title || "Current course",
            source: "page",
            resourceType: null,
        });
    }, [isEnrolled, id, data.title, setAiScope]);

    const blockResourceAccess = () => {
        toast({
            title: "Enrollment required",
            description:
                "Preview this course overview only. Enroll via the mobile app to watch videos and read lesson materials.",
            status: "info",
            duration: 5000,
            isClosable: true,
        });
    };

    const VideoItem = ({ link, lesson, number, downloaded = false, selected = false, canAccess = true }) => {
        const visited =
            lesson && link
                ? isResourceVisited(String(id), String(lesson._id), link)
                : false;

        const onTap = () => {
            if (!canAccess) {
                blockResourceAccess();
                return;
            }
            if (lesson && link) {
                markResourceVisited(String(id), String(lesson._id), link);
                setVisitTick((t) => t + 1);
            }
            if (lesson) {
                setAiScope({
                    courseId: String(id),
                    lessonId: String(lesson._id),
                    s3Keys: link ? [normalizeS3Key(link)] : [],
                    label: `${lesson.title} · Video ${number}`,
                    source: "page",
                    resourceType: "video",
                });
            }
            const videoKey = `video${number > 1 ? number - 1 : ''}`;  // video, video1, video2...
            console.log(link);
            verifyDevice()

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
                setPlayVideo(`${mediaUrl(link)}`);
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
                        setPlayVideo(`${mediaUrl(link)}`)
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
                        setPlayVideo(`${mediaUrl(link)}`)
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
                        setPlayVideo(`${mediaUrl(link)}`)
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
                        setPlayVideo(`${mediaUrl(link)}`)
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
                        setPlayVideo(`${mediaUrl(link)}`)
                    }
                    break;
                default:
                    console.log('default')
                    break;
            }
            setSelectedVideo(selectedVideo)

        }


        return <>
            <div className={`lesson-resource-row ${!canAccess ? 'opacity-60' : 'hover:border-brand/30 hover:bg-brand/5'}`}>
                <div>
                    <div className="flex items-center justify-between text-xs">
                        <div
                            onClick={() => onTap()}
                            className={`flex items-center gap-2 h-full w-full p-3 ${!canAccess ? 'pointer-events-auto' : 'cursor-pointer'}`}>
                            <PlayCircle className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
                            <span className="text-msl-text font-medium">Video {number}</span>
                            {visited ? (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-1" strokeWidth={2.5} />
                            ) : null}
                        </div>

                        {canAccess ? (
                        <div className="p-3 flex items-center gap-2">
                            {!downloaded ?
                                <span className=""
                                    onClick={() => {
                                        window.electronAPI.sendData('download',
                                            {
                                                url: `${mediaUrl(link)}`,
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
                        ) : (
                            <span className="p-3 text-[10px] text-msl-muted inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" strokeWidth={2} /> Locked
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    }

    const PdfItem = ({ link, lesson, number, downloaded = false, selected = false, canAccess = true }) => {
        const visited =
            lesson && link
                ? isResourceVisited(String(id), String(lesson._id), link)
                : false;

        const onTap = () => {
            if (!canAccess) {
                blockResourceAccess();
                return;
            }
            if (lesson && link) {
                markResourceVisited(String(id), String(lesson._id), link);
                setVisitTick((t) => t + 1);
            }
            if (lesson) {
                setAiScope({
                    courseId: String(id),
                    lessonId: String(lesson._id),
                    s3Keys: link ? [normalizeS3Key(link)] : [],
                    label: `${lesson.title} · PDF ${number}`,
                    source: "page",
                    resourceType: "pdf",
                });
            }
            if (downloaded) {
                console.log('------------------INTERCEPT URL PDF-------------------')
                window.electronAPI.sendData('decrypt-pdf', link)
                window.electronAPI.receiveData('getDecrypt-pdf', (receivedData) => {
                    console.log('getDecrypt pdf 1', receivedData);
                    navigator(`/preview/pdf/${id}`, { state: { data: receivedData, online: false }, type: 'pdf' });
                });
                console.log('~~DOWNLOADED...', number)
            }
            else {
                console.log('NOT DOWNLOADED...', number)
                navigator(`/preview/pdf/${id}`, { state: { data: link, online: true }, type: 'pdf' });
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
                            navigator(`/preview/pdf/${id}`, { state: { data: receivedData, online: false }, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                        navigator(`/preview/pdf/${id}`, { state: { data: link, online: true }, type: 'pdf' });
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
                            navigator(`/preview/pdf/${id}`, { state: { data: receivedData, online: false }, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                        navigator(`/preview/pdf/${id}`, { state: { data: receivedData, online: false }, type: 'pdf' });
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
                            navigator(`/preview/pdf/${id}`, { state: { data: receivedData, online: false }, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                        navigator(`/preview/pdf/${id}`, { state: { data: link, online: true }, type: 'pdf' });
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
                            navigator(`/preview/pdf/${id}`, { state: { data: receivedData, online: false }, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                        navigator(`/preview/pdf/${id}`, { state: { data: link, online: true }, type: 'pdf' });
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
                            navigator(`/preview/pdf/${id}`, { state: { data: receivedData, online: false }, type: 'pdf' });
                        });
                        console.log('~~DOWNLOADED...', number)
                    }
                    else {
                        console.log('NOT DOWNLOADED...', number)
                        navigator(`/preview/pdf/${id}`, { state: { data: link, online: true }, type: 'pdf' });
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
            <div className={`lesson-resource-row ${!canAccess ? 'opacity-60' : 'hover:border-brand/30 hover:bg-brand/5'}`}>
                <div>
                    <div className="flex items-center justify-between text-xs">
                        <div
                            onClick={() => onTap()}
                            className={`flex items-center gap-2 h-full w-full p-3 ${canAccess ? 'cursor-pointer' : ''}`}>
                            <FileText className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
                            <span className="text-msl-text font-medium">PDF {number}</span>
                            {visited ? (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-1" strokeWidth={2.5} />
                            ) : null}
                        </div>
                        {canAccess ? (
                        <div className="p-3 flex items-center gap-2">
                            {!downloaded ?
                                <span className=""
                                    onClick={() => {
                                        window.electronAPI.sendData('download',
                                            {
                                                url: `${mediaUrl(link)}`,
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
                        ) : (
                            <span className="p-3 text-[10px] text-msl-muted inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" strokeWidth={2} /> Locked
                            </span>
                        )}
                    </div>

                </div>
            </div>
        </>
    }

    const canAccessResources = isEnrolled;



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
        <div className="flex h-screen bg-msl-bg overflow-hidden">
            <SideBar mycourse={true} />
            {isLoading ?
                <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 space-y-6 max-w-5xl mx-auto w-full">
                    <div className="animate-pulse rounded-msl bg-msl-accent/60 h-8 w-48" />
                    <div className="animate-pulse rounded-msl bg-msl-accent/60 aspect-video w-full" />
                    <div className="animate-pulse rounded-msl bg-msl-accent/60 h-10 w-2/3" />
                    <div className="animate-pulse rounded-msl bg-msl-accent/60 h-12 w-full" />
                    <div className="animate-pulse rounded-msl bg-msl-accent/60 h-48 w-full" />
                </div>
                :
                <div className="flex-1 overflow-y-auto min-w-0">
                    <div className="px-6 lg:px-10 py-6 space-y-6 max-w-5xl mx-auto w-full">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Link
                                to={isEnrolled ? "/personal/course" : "/course"}
                                className="inline-flex items-center gap-1.5 text-sm text-msl-muted hover:text-brand transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                                Back to courses
                            </Link>
                            {isEnrolled ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-msl">
                                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                                    Enrolled
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-msl">
                                    <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                                    Preview only
                                </span>
                            )}
                        </div>

                        {!isEnrolled ? (
                            <div className="glass-card rounded-msl p-4 flex items-start gap-3 border-amber-500/25 bg-amber-500/5">
                                <Smartphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.75} />
                                <div>
                                    <p className="text-sm font-medium text-msl-text">Enrollment required for full access</p>
                                    <p className="text-xs text-msl-muted mt-1">
                                        Browse this overview freely. Enroll via the MSL mobile app to unlock videos and lesson PDFs.
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        <div className="rounded-msl overflow-hidden border border-msl-border bg-black shadow-card">
                            {!playVideo ? (
                                <div className="aspect-video bg-black relative">
                                    <img
                                        className="object-cover w-full h-full"
                                        src={mediaUrl(data?.thumbnail)}
                                        alt={data?.title || "Course preview"}
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                                </div>
                            ) : (
                                <video
                                    className="w-full aspect-video bg-black"
                                    controls
                                    controlsList="nodownload"
                                    src={playVideo}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h1 className="font-display text-2xl lg:text-3xl font-bold text-msl-text tracking-tight leading-tight">
                                {data?.title}
                            </h1>
                            <p className="text-sm text-msl-muted">
                                {lessons?.length ?? 0} lessons · Self-paced learning
                            </p>
                        </div>

                        <div className="glass-card rounded-msl overflow-hidden">
                            <div className="flex border-b border-msl-border">
                                <button
                                    type="button"
                                    onClick={() => setCourseTab("overview")}
                                    className={`flex-1 px-4 py-3.5 text-sm font-semibold transition-colors ${
                                        courseTab === "overview"
                                            ? "text-brand border-b-2 border-brand bg-brand/5"
                                            : "text-msl-muted hover:text-msl-text hover:bg-msl-accent/30"
                                    }`}
                                >
                                    Overview
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCourseTab("content")}
                                    className={`flex-1 px-4 py-3.5 text-sm font-semibold transition-colors ${
                                        courseTab === "content"
                                            ? "text-brand border-b-2 border-brand bg-brand/5"
                                            : "text-msl-muted hover:text-msl-text hover:bg-msl-accent/30"
                                    }`}
                                >
                                    Course content
                                    <span className="ml-1.5 text-xs font-normal text-msl-muted">
                                        ({lessons?.length ?? 0})
                                    </span>
                                </button>
                            </div>

                            {courseTab === "overview" ? (
                                <div className="p-6 lg:p-8">
                                    <h2 className="font-display text-lg font-semibold text-msl-text mb-3">
                                        About this course
                                    </h2>
                                    <p className="text-sm text-msl-muted leading-relaxed whitespace-pre-line">
                                        {data?.description}
                                    </p>
                                </div>
                            ) : (
                                <div className="px-2 py-3">
                                        <Accordion allowMultiple allowToggle>
                                            {data?.lessons?.length == 0 ?
                                                <div className="text-lg font-semibold text-center my-2 text-gray-500">
                                                    <p>Not Available</p>
                                                </div>
                                                : ''}
                                            {lessons?.map((item, id) => {
                                                const lessonDone = isLessonFullyVisited(String(id), item);
                                                return <AccordionItem key={`${id}-${visitTick}`}>
                                                    <h2>
                                                        <AccordionButton className="!py-3.5 hover:!bg-msl-accent/40 rounded-lg !px-3">
                                                            <Box as='span' flex='1' textAlign='left'>
                                                                <p className='text-sm font-medium text-msl-text pr-2 flex items-center gap-2'>
                                                                    {lessonDone ? (
                                                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                                                                    ) : null}
                                                                    <span>{item?.title}</span>
                                                                </p>
                                                            </Box>
                                                            <AccordionIcon />
                                                        </AccordionButton>
                                                    </h2>
                                                    <AccordionPanel pb={4}>
                                                        <div>
                                                            <p className='text-xs text-msl-muted mb-3 leading-relaxed'> {item?.description} </p>
                                                            {item?.video != null ?
                                                                <div>
                                                                    <VideoItem
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                                                                        lesson={item}
                                                                        canAccess={canAccessResources}
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
                            )}
                        </div>
                    </div>
                </div>
            }
        </div>
    </>
}

export default PreviewCourse;


