import { InputGroup, InputLeftElement, Input, Spinner} from "@chakra-ui/react";
import SideBar from "../Components/General/SideBar";
import Item from "../Components/Course/Item";
import ItemView from "../Components/Course/ItemView";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { userCourseList } from "../Services/CourseApi";


const MyCourses = () => {
    
    const [isLoading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [myCourses, setMycourses] = useState([]);
    let [originalData, setOriginalData] = useState([]);
    let [search, setSearch] = useState("");
    

    // ---------------------API CALLS--------------------------//

    const getMyCoursesCall = () => {
        let user = localStorage.getItem('user')
        let formatUser = JSON.parse(user) 
        console.log('formated user email', formatUser?.email);
        userCourseList(formatUser?.email).then((response) => {
            setMycourses(response.response);

            setLoading(false)
            console.log('getMyCoursesCall response :>> ', response.response);
        }).catch((error) => {
            console.log('getMyCoursesCall error :>> ', error);
            setLoading(false)
        })
    }

    const onSearch = (search) => { 
        console.log('category :>> ', search);
        console.log('originalData :>> ', originalData);
        console.log('courses :>> ', courses);

        let list = originalData.filter((value) => 
            value.title.toLowerCase().includes(search.toLowerCase()) ||
            value.description.toLowerCase().includes(search.toLowerCase()) ||
            value.category.toLowerCase().includes(search.toLowerCase())
        )

        
        setCourses(list)
    }

    // ---------------------API CALLS-------------------------- //
    
    
    useEffect(() => {
        getMyCoursesCall()
    }, [])

    

    
    return <>
    <div className="flex gap-1 ">
        <div className="min-w-[250px]">
            <SideBar mycourse={ true } />
        </div>

        <div className="w-full bg-gray-50">

            {/* Heading */}
            <div className="m-2 mt-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-bold">My Courses</h1>

                    <div>
                    <InputGroup>
                        <InputLeftElement pointerEvents='none'>
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.5 17.5L22 22m-2-11a9 9 0 1 0-18 0a9 9 0 0 0 18 0" color="currentColor"/></svg>
                            </span>
                        </InputLeftElement>
                        <Input type='text' placeholder='Search' />
                    </InputGroup>
                    </div>
                </div>
            </div>

            {/* Main Body */}
            <div className="mx-3">

            <div className="flex flex-row flex-wrap my-5">
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
                            myCourses?.map((value) => {
                                return <div className="flex-initial min-w-[300px] m-1">
                                    <Item
                                        route={`/course/preview/${value._id}`}
                                        image={`https://api.mslelearning.com/${value.thumbnail}`}
                                        title={value.title}
                                        description={value.description}
                                            price={value.price}
                                            category={[value.categoryId.name]}
                                    />
                                </div>
                            })
                        
                    }
                      

                        {
                            !isLoading && myCourses?.length == 0 ? 
                                <div className="my-10 bg-white p-10 rounded-[100px] mx-auto">
                                    <p className="text-xl font-bold text-center">Not Available</p>
                                </div>
                                : ''
                        }
                      </div>



            </div>
          
              
        </div>
        
    </div>
</>
}

export default MyCourses