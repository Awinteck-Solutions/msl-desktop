import { Button, InputGroup, InputLeftElement, Input, Spinner} from "@chakra-ui/react";
import SideBar from "../Components/General/SideBar";
import Item from "../Components/Course/Item";
import ItemView from "../Components/Course/ItemView";
import { Link, useNavigate } from "react-router-dom";
import { categoryList, courseList, userCourseList } from "../Services/CourseApi";
import { useEffect, useState } from "react";
import { verify } from "../Services/UserApi";




const Dashboard = () => {    
    const navigator = useNavigate()
    
    const [isLoadingCourse, setLoadingCourse] = useState(true);
    const [isLoading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [myCourses, setMycourses] = useState([]);
    let [originalData, setOriginalData] = useState([]);
    const [category, setCategory] = useState([]);
    const [categoryTab, setCategoryTab] = useState('all')

    // ---------------------API CALLS--------------------------//
 const getCategoryCall = () => {
        categoryList().then((response) => {
            setCategory(response.response);
            setLoading(false)
            console.log('getCategoryCall response :>> ', response.response);

            getCoursesCall()

        }).catch((error) => {
            console.log('getCategoryCall error :>> ', error);
            setLoading(false)
        })
    }

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

    const onCategorySelected = (category) => { 
        console.log('category :>> ', category);
        console.log('originalData :>> ', originalData);
        console.log('courses :>> ', courses);

        setCategoryTab(category)
        let list = originalData.filter((value) => { 
            if (value.categoryId.name == category) return value;
            else if (category == 'all') return courses;
        });
        setCourses(list)
    }

    // VERIFY


    // ---------------------API CALLS-------------------------- //
    
    
    useEffect(() => {
        let user = localStorage.getItem('user')
        if(!user) {
            console.log('dash null user', user)
            navigator('/login')
        }
        if (user !== null && user != undefined) { 
            console.log('ALLOWED-LOGIN STILL')
            getMyCoursesCall()
            getCategoryCall()
            
     
        } else {  
            console.log('ALLOWED-LOGIN STILL NOT')
            navigator('/login')
        }

        // console.log('window', window.electronAPI.test)
        // window.electronAPI.sendData('dashboard', 'dashboard test')
       
    }, [])
    

    const CategoryBar = () => {

        
        return <>
         <div className="flex space-x-4 mt-10">
         <p
                    onClick={() => {
                        onCategorySelected('all')
                                }}
                    className={
                        categoryTab=='all' ?
                        "bg-[#336699] hover:bg-[#336699] hover:text-white duration-200 cursor-pointer border-2 border-[#336699] text-white rounded-3xl p-2 w-28 text-center font-semibold"
                        :
                        "hover:bg-[#336699] hover:text-white duration-200 bg-white cursor-pointer border-2 border-[#336699] text-[#336699] rounded-3xl p-2 w-28 text-center font-semibold"
                    }
                >ALL</p>
                {category?.sort((a,b)=> Number(a.position) - Number(b.position)).map((item)=>{
                    return     <p
                    onClick={() => {
                        onCategorySelected(item.name)
                                 }}
                                 className={
                                    categoryTab==item.name ?
                                    "bg-[#336699] hover:bg-[#336699] hover:text-white duration-200 border-2 border-[#336699] text-white rounded-3xl p-2 w-28 text-center font-semibold"
                                    :
                                    "hover:bg-[#336699] hover:text-white duration-200 bg-white cursor-pointer border-2 border-[#336699] text-[#336699] rounded-3xl p-2 w-28 text-center font-semibold"
                                }
                >{item.name}</p>
                })} 
    
                        </div>
        </>
    }
     
    return <>
        <div className="flex gap-1 ">
            <div className="min-w-[250px]">
                <SideBar dashboard={ true } />
            </div>

            <div className="w-full bg-gray-50">

                {/* Heading */}
                <div className="m-2 mt-4">
                    <div className="flex justify-between">
                        <h1 className="text-2xl font-bold">Dashboard</h1>

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

                    {/* Recent courses here */}
                    <div className="flex justify-between">
                        <h1 className="font-bold mt-2">My Courses</h1>
                        <Link to={'/personal/course'} className="font-bold bg-[#336699] text-white rounded p-1 px-2">View all</Link>
                    </div>
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
                                    category={[value.categoryId.name]}
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

export default Dashboard;

