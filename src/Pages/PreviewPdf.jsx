import SideBar from "../Components/General/SideBar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
 

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Viewer, Worker, ProgressBar } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen';
import { useState } from "react";
import { Progress } from '@chakra-ui/react'


const PreviewPdf = () => {
    let { id } = useParams();
    const location = useLocation();
    let { state } = location
    console.log('online, state', state, location)
    const navigator = useNavigate()

    let file = state.data.split('/')
    let pdfFile = file[file.length - 1];
    console.log('fileName: ', pdfFile)

    const defaultLayout = defaultLayoutPlugin({
        toolbarPlugin: {
            toolbarItems: (toolbarItems) => {
                console.log('toolbarItems :>> ', toolbarItems);
                // Filter out the download button
                return toolbarItems.filter((item) => item.type !== 'Download');
            },
        },
    });

    // pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

    const [pageNumber, setPageNumber] = useState(0)
    const handleDocumentLoad = (e) => {
        //  console.log(`Number of pages: ${e.doc.numPages}`);
        setPageNumber(e.doc.numPages)
    };

    const [zoom, setZoom] = useState(1);
    const onZoomInClicked = () => {
        // console.log('zoom :>> ', zoom);
        setZoom(zoom + 1)
    }
    const onZoomOutClicked = () => {
        // console.log('zoom :>> ', zoom);
        setZoom(zoom - 1)
    }


    const zoomPluginInstance = zoomPlugin();

    const fullScreenPluginInstance = fullScreenPlugin();
    const { EnterFullScreenButton } = fullScreenPluginInstance;


    const renderPage = (props) => {
        return (
            <>
                {props.canvasLayer.children}
                <div style={{ userSelect: 'none' }}>
                    {props.textLayer.children}
                </div>
                {props.annotationLayer.children}
            </>
        );
    };


    const [pdfError, setPdfError] = useState(false);

    const handlePdfError = (e) => {
        console.error('handlePdfError',e)
        setPdfError(true);
    };


    return (
        // <div className='text-base' onContextMenu={(e) => e.preventDefault()}>

        <div className="flex gap-1 ">
            <div className="min-w-[300px]">
                <SideBar mycourse={true} />
            </div>

            <div className="w-full bg-gray-50 overflow-scroll h-screen">

                <div className="flex justify-around ">

                    <button className="px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded m-2 text-white" onClick={() => navigator(`/course/preview/${id}`)}>
                        Go Back
                    </button>
                    <div className='flex flex-wrap justify-between space-x-2 items-center w-fit hidden lg:inline-flex'>
                        <div
                            className='bg-gray-200 h-8 hover:bg-gray-400 hover:text-white rounded'>
                            <EnterFullScreenButton />
                        </div>
                        <p>Full Screen (Esc key to minimize)</p>
                    </div>
                    <p className='p-2 font-medium'>Page {1}/ {pageNumber}</p>
                </div>
                {pdfError ? (
                    <p className="text-red-500 text-center p-5 w-full">Sorry, Please check your internet connection.</p>
                ) : (
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">

                        <div
                            style={{
                                flex: 1.2,
                                overflow: 'hidden',
                            }}>

                            <Viewer
                                renderPage={renderPage}
                                viewMode='SinglePage'
                                renderLoader={(percentages) => (
                                    <div style={{ width: '240px' }}>
                                        {/* <ProgressBar progress={Math.round(percentages)} /> */}
                                        <Progress size='sm' colorScheme={'blue'} hasStripe isIndeterminate />
                                        <p className="text-[10px] text-center text-blue-700 p-1 w-full">Please wait while we prepare this file</p>
                                    </div>
                                )}
                                onDocumentLoad={handleDocumentLoad}
                                fileUrl={state.online? `https://api.mslelearning.com/pdf/${pdfFile}`: state.data}
                                // fileUrl={"C:/Users/awins/Downloads/dummy.pdf"}
                                // fileUrl={`${resBaseUrl}/pdf/${pdfFile}`}
                                // fileUrl={bucketPdf}
                                // fileUrl={pdf}
                                renderError={handlePdfError}
                                plugins={[zoomPluginInstance, fullScreenPluginInstance]} />
                        </div>
                    </Worker>
                )}
            </div>
        </div>
    )




}

export default PreviewPdf;


