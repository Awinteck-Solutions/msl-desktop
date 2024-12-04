import { Button, InputGroup, InputLeftElement, Input, Spinner} from "@chakra-ui/react";
import SideBar from "../Components/General/SideBar";
import Item from "../Components/Course/Item";
import ItemView from "../Components/Course/ItemView";
import { Link } from "react-router-dom";
import { courseList, userCourseList } from "../Services/CourseApi";
import { useEffect, useState } from "react";



const Course = () => {
    
    const [isLoadingCourse, setLoadingCourse] = useState(true);
    const [isLoading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [myCourses, setMycourses] = useState([]);
    let [originalData, setOriginalData] = useState([]);
    

    const [all, setAll] = useState(true)
    const [icag, setIcag] = useState(false)
    const [citg, setCitg] = useState(false)
    const [inter, setInter] = useState(false)
    const [master, setMaster] = useState(false)

    // ---------------------API CALLS--------------------------//

    const getCoursesCall = () => {
        courseList().then((response) => {
            setCourses(response.response);
            setLoadingCourse(false)
            setOriginalData(response.response)
            console.log('getCoursesCall response :>> ', response.response);
        }).catch((error) => {
            console.log('getCoursesCall error :>> ', error);
            setLoadingCourse(false)
        })
    }
    const onCategorySelected = (category) => { 
        console.log('category :>> ', category);
        console.log('originalData :>> ', originalData);
        console.log('courses :>> ', courses);


        let list = originalData.filter((value) => { 
            if (value.category == category) return value;
            else if (category == 'all') return courses;
        });
        setCourses(list)
    }

    // ---------------------API CALLS-------------------------- //
    
    
    useEffect(() => {
        getCoursesCall()
    }, [])
    

    const CategoryBar = () => {

        
        return <>
         <div className="flex space-x-4 mt-10">
                            <p
                    onClick={() => {
                        onCategorySelected('all')
                        setAll(true)
                        setMaster(false)
                        setIcag(false)
                        setInter(false)
                        setCitg(false)
                                }}
                    className={
                        all==true ?
                        "bg-[#336699] hover:bg-[#336699] hover:text-white duration-200 border-2 border-[#336699] text-white rounded-3xl p-2 w-28 text-center font-semibold"
                        :
                        "hover:bg-[#336699] hover:text-white duration-200 bg-white cursor-pointer border-2 border-[#336699] text-[#336699] rounded-3xl p-2 w-28 text-center font-semibold"
                    }
                >ALL</p>
                            <p
                    onClick={() => {
                        onCategorySelected('ICAG')
                        setIcag(true)
                        setMaster(false)
                        setAll(false)
                        setInter(false)
                        setCitg(false)
                                 }}
                                 className={
                                    icag ?
                                    "bg-[#336699] hover:bg-[#336699] hover:text-white duration-200 border-2 border-[#336699] text-white rounded-3xl p-2 w-28 text-center font-semibold"
                                    :
                                    "hover:bg-[#336699] hover:text-white duration-200 bg-white cursor-pointer border-2 border-[#336699] text-[#336699] rounded-3xl p-2 w-28 text-center font-semibold"
                                }
                >ICAG</p>
                            <p
                    onClick={() => {
                        onCategorySelected('CITG')
                        setCitg(true)
                        setMaster(false)
                        setAll(false)
                        setIcag(false)
                        setInter(false)
                                 }}
                                 className={
                                    citg ?
                                    "bg-[#336699] hover:bg-[#336699] hover:text-white duration-200 border-2 border-[#336699] text-white rounded-3xl p-2 w-28 text-center font-semibold"
                                    :
                                    "hover:bg-[#336699] hover:text-white duration-200 bg-white cursor-pointer border-2 border-[#336699] text-[#336699] rounded-3xl p-2 w-28 text-center font-semibold"
                                }
                >CITG</p>
                            <p
                    onClick={() => {
                        onCategorySelected('Intervention')
                        setInter(true)
                        setMaster(false)
                        setAll(false)
                        setIcag(false)
                        setCitg(false)
                                 }}
                                 className={
                                    inter ?
                                    "bg-[#336699] hover:bg-[#336699] hover:text-white duration-200 border-2 border-[#336699] text-white rounded-3xl p-2 w-28 text-center font-semibold"
                                    :
                                    "hover:bg-[#336699] hover:text-white duration-200 bg-white cursor-pointer border-2 border-[#336699] text-[#336699] rounded-3xl p-2 w-28 text-center font-semibold"
                                }
                >Intervention</p>
                            <p
                    onClick={() => {
                        onCategorySelected('masterclass')
                        setMaster(true)
                        setAll(false)
                        setIcag(false)
                        setInter(false)
                        setCitg(false)
                                 }}
                                 className={
                                    master ?
                                    "bg-[#336699] hover:bg-[#336699] hover:text-white duration-200 border-2 border-[#336699] text-white rounded-3xl p-2 w-28 text-center font-semibold"
                                    :
                                    "hover:bg-[#336699] hover:text-white duration-200 bg-white cursor-pointer border-2 border-[#336699] text-[#336699] rounded-3xl p-2 w-28 text-center font-semibold"
                                }
                >Masterclass</p>
    
                        </div>
        </>
    }
     
    return <>
        <div className="flex gap-1 ">
            <div className="min-w-[250px]">
                <SideBar course={ true } />
            </div>

            <div className="w-full bg-gray-50">

                {/* Heading */}
                <div className="m-2 mt-4">
                    <div className="flex justify-between">
                        <h1 className="text-2xl font-bold">All Courses</h1>

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

                    {/* Categories */}
                    
                    <CategoryBar/>
                    
                  
                    {/* All courses */}

                    <div className=" mt-5 ">
                        
                        <div className="flex flex-row flex-wrap">
                            {isLoadingCourse ? 
                                <div className="text-center m-auto">
                                     <Spinner size='xl'
                                        thickness='4px'
                                        speed='0.65s'
                                        emptyColor='gray.200'
                                            color='blue.500'
                                        />
                                </div>
                            : 
                            
                        courses?.map((value) => { 
                              return  <div className="flex-initial min-w-[300px] m-1">
                                  <ItemView
                                      link={value.link}
                                image={`https://api.mslelearning.com/${value.thumbnail}`}
                                title={value.title}
                                description={value.description}
                                    price={value.price}
                                    category={[value.category]}
                                    rating={4.5}
                                    lessons={value.lessons}
                                enrolled={100}
                            />
                                </div>
                        })
                        }
                            
                            {
                            !isLoadingCourse && courses?.length == 0 ? 
                                <div className="my-10 bg-white p-10 rounded-[100px] mx-auto">
                                    <p className="text-xl font-bold text-center">Not Available</p>
                                </div>
                                : ''
                        }
                      </div>
                    </div>

                </div>
              
                  
            </div>
            
        </div>
    </>
 }

export default Course;

