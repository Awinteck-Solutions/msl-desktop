import SideBar from "../Components/General/SideBar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PDFReader } from 'reactjs-pdf-reader';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Viewer, Worker, ProgressBar } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { zoomPlugin} from '@react-pdf-viewer/zoom';
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen';
import { useState } from "react";


const PreviewPdf = () => { 
    let { id } = useParams();
    const location = useLocation();
    let { state } = location
    console.log('link', state)
    const navigator = useNavigate()

    let file = state.split('/')
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
        setZoom(zoom+1)
    }
    const onZoomOutClicked = () => {
        // console.log('zoom :>> ', zoom);
        setZoom(zoom-1)
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
    

    return (
        // <div className='text-base' onContextMenu={(e) => e.preventDefault()}>

        <div className="flex gap-1 ">
             <div className="min-w-[300px]">
            <SideBar mycourse={ true } />
        </div>
            
            <div className="w-full bg-gray-50">
                <button onClick={()=> navigator(`/course/preview/${id}`)}>
                    Go Back
                </button>
            <div className="flex justify-around ">
                <div className='flex flex-wrap justify-between space-x-2 items-center w-fit hidden lg:inline-flex'>
                    <div
                          style={{
                            alignItems: 'center',
                            backgroundColor: '#eeeeee',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            padding: '4px',
                        }}

                        className='bg-gray-200 hover:bg-gray-400 hover:text-white rounded'>
                        <EnterFullScreenButton />
                    </div>
                    <p>Fullscreen</p>
                </div>
                <p className='p-2 font-medium'>Page {1}/ {pageNumber}</p>
            </div>

             <Worker  workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                
                 <div
                    style={{
                    flex: 1.2,
                    overflow: 'hidden',
                }}>

                    <Viewer
                        renderPage={renderPage}
                        viewMode='SinglePage'
                        renderLoader={(percentages) => (
                            <div style={{width: '240px'}}>
                                <ProgressBar progress={Math.round(percentages)} />
                            </div>
                        )}
                    onDocumentLoad={handleDocumentLoad}
                        fileUrl={'https://api.mslelearning.com/pdf/'+pdfFile}
                        // fileUrl={newFile}
                        // fileUrl={`${resBaseUrl}/pdf/${pdfFile}`}
                        // fileUrl={bucketPdf}
                        // fileUrl={pdf}
                        
                        plugins={[zoomPluginInstance, fullScreenPluginInstance]} />
                        </div>
            </Worker>
            
        </div>
        </div>
    )


    return (
        <Worker
            // workerUrl={`https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}
            workerUrl="/pdf.worker.min.js"
        >
        <div style={{ height: '750px' }}>
          <Viewer fileUrl={`https://mslbucket.s3.us-east-1.amazonaws.com/${state}`} plugins={[defaultLayout]} />
        </div>
      </Worker>
    );

    
    return <>
    <div className="flex gap-1 ">
        <div className="min-w-[300px]">
            <SideBar mycourse={ true } />
        </div>

        <div className="w-full bg-gray-50">

            {/* Heading */}
            <div className="m-2 mt-4">
                <div className="flex justify-between">
                        <h1 className="text-xl font-bold ml-1 truncate max-w-[600px]">{ state }</h1>
                </div>
            </div>

            {/* Main Body */}
                <div className="mx-3">

                    <PDFReader url={`https://mslbucket.s3.us-east-1.amazonaws.com/${state}` } />
                   
                       
            </div>
          
              
        </div>
        
    </div>
    </>
    

}

export default PreviewPdf;


