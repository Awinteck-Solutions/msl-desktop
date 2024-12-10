import { Divider } from '@chakra-ui/react'
import { Link } from 'react-router-dom';
import 'animate.css';
import { Spinner  } from '@chakra-ui/react'
import {
    Input,Textarea,Select,
} from '@chakra-ui/react'
import { useState ,useEffect} from 'react'
import SideBar from '../Components/General/SideBar';

const Feedback = () => {
     // Check if user is logged in
     let user = JSON.parse(localStorage.getItem('profile'))

     const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    


    const [phone, setPhone] = useState('')
    const [message, setMessage] = useState('')
    const [type, setType] = useState('')

    const [statusShow, setStatusShow] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')

    const feedbackTypes = [
        'Report a bug', 'Course Enrolment', 
        'Suggest Improvement', 'Request a feature',
        'Course content', 'Others'
    ]

    


    return (
        <div className="flex gap-1 ">
            <div className="min-w-[300px]">
                <SideBar feedback={ true } />
            </div>

            <div className="w-full bg-white">
            <div className=' py-10 px-4  text-black'>
                    <div>
                        <h1 className="font-bold  text-lg text-center">Submit Your Feedback Here!</h1>
                   
                    </div>
                    
                    {isLoading? <div className='text-center '>
                        <Spinner size='xl'
                         thickness='4px'
                         speed='0.65s'
                         emptyColor='gray.200'
                            color='blue.500'
                        />
                    </div>
                        :
                        <div className='lg:m-auto mx-5 space-y-2 bg-white lg:p-5 rounded min-w-[450px]'>
                            {statusShow? <p className='bg-blue-800 text-white p-2 w-fit m-auto rounded'> { statusMessage} </p>: ''}
                        <div className='lg:grid grid-cols-2 gap-3 lg:space-y-0 space-y-2'>
                            <div className='text-black'>
                                <Select style={{height:'3em',color:'black'}} onChange={(e) => setType(e.target.value)} placeholder='Select option'>
                                    {feedbackTypes.map((value,index) => {
                                        return  <option key={index} value={value}>{value}</option>
                                    })}
                                </Select> 
                            </div>
                            
                            <Input onChange={(e) => {setPhone(e.target.value) }} placeholder='Phone' size='lg' className='' />
                                        
                        </div>
                        <div>
                        <Textarea onChange={(e) => {setMessage(e.target.value)  }} placeholder='Message' height={'240px'} />
                                            
                        </div>
                        <div>
                                <button
                                    className='rounded border text-white bg-[#336699] w-full p-2'
                                    // onClick={() => { SendFeedbackAPI() }}
                                >
                                    Send Feedback
                                </button>
                        </div>
                        </div>
                     }
                </div>
            </div>
        </div>
        
    )
}

export default Feedback;