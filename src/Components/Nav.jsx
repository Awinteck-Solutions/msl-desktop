
import { Menu } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

const Nav = ({home=false,feedback=false,request=false,allCourses=false,myCourses=false, setColor=false})=>{
  let [menuShow, setMenuShow]  = useState();
  const onMenuTap = ()=>{
    setMenuShow(true)  //show for small screens
    if(menuShow === true){
      setMenuShow(false) //hide for small screens
    }else{
      setMenuShow(true)
    }
  }
  const navigator = new useNavigate()
  let user = localStorage.getItem('profile')

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user !== null && user != undefined) { 
      setIsLoggedIn(true);
    } else {  
      setIsLoggedIn(false);
    }
  }, [isLoggedIn])
  
  const logout = () => { 
    navigator('/signin')
    setIsLoggedIn(!isLoggedIn)
    localStorage.clear()
  }

    return(
        <>
         {/* <!-- MAIN HEADER --> */}
        <nav className={setColor ?
          "text-black shadow-lg animate__animated animate__fadeInDown bg-[#00608b] text-white z-10"
        : "bg-white shadow-lg border animate__animated animate__fadeInDown z-10"}>
            {/* <!-- Mobile menu --> */}
          <div className="flex justify-between w-11/12 m-auto pt-5">
          <div className="flex px-2 pt-2">
                <Link className="lg:mr-5 h-fit mt-1 " to="/">
                  <img className=" object-fill w-24" src="/mslogo.png" alt="" />
              </Link>
            </div>
            <div className="mt-2 py-3 h-16 flex space-x-4 ">
              <Link className={home ?
                    "lg:block hidden px-4 h-fit py-[5px] rounded-3xl bg-blue-700 transition duration-300 text-sm text-white"
                  : `lg:block hidden px-4 h-fit py-[5px] rounded-3xl hover:bg-blue-700 hover:text-white transition duration-300 text-sm ${setColor?'text-white':'text-black'}`} to="/">Home</Link> 
                    
                    <Link className={allCourses ?
                     "lg:block hidden px-4 h-fit py-[5px] rounded-3xl bg-blue-700 transition duration-300 text-sm text-white"
                     : `lg:block hidden px-4 h-fit py-[5px] rounded-3xl hover:bg-blue-700 hover:text-white transition duration-300 text-sm ${setColor?'text-white':'text-black'}`} to="/dashboard">Dashboard</Link> 
                    
                {isLoggedIn ?
              <div className='flex space-x-4'>
               
                    <Link className={myCourses ?
                     "lg:block hidden px-4 h-fit py-[5px] rounded-3xl bg-blue-700 transition duration-300 text-sm text-white"
                     : `lg:block hidden px-4 h-fit py-[5px] rounded-3xl hover:bg-blue-700 hover:text-white transition duration-300 text-sm ${setColor?'text-white':'text-black'}`} to="/course/personal">My Courses</Link>
              
              <Link className={feedback ?
                    "lg:block hidden px-4 h-fit py-[5px] rounded-3xl bg-blue-700 transition duration-300 text-sm text-white"
                    : `lg:block hidden px-4 h-fit py-[5px] rounded-3xl hover:bg-blue-700 hover:text-white transition duration-300 text-sm ${setColor?'text-white':'text-black'}`} to="/feedback">Feedbacks</Link> 
                
                <Link onClick={logout} className={`lg:block hidden px-4 h-fit py-[5px] rounded-3xl hover:bg-blue-700 hover:text-white transition duration-300 text-sm ${setColor?'text-white':'text-black'}`} >Logout</Link> 
                
                  

                </div> 
                :
                <Link className={`lg:block hidden px-4 h-fit py-[5px] rounded-3xl hover:bg-blue-700 hover:text-white transition duration-300 text-sm ${setColor?'text-white':'text-black'}`} to="/signin">Sign In</Link> 
                 
              }
              <div className='block lg:hidden'>
                    <Menu.Root open={isOpen} onSelect={(id) => console.log(id)}>
                <Menu.Trigger className={`${setColor?'text-white':'text-black'}`}>
                   <svg id="profileimg" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path id="profileimg" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </Menu.Trigger>
                      <Menu.Positioner className='bg-white rounded border shadow-lg '>
                        <Menu.Content className='space-y-1'>
                          <Link to={'/'} className='block border-b text-black hover:bg-blue-700 hover:text-white pr-10 pl-2 py-1 duration-300'>Home</Link>
                      <Link to={'/course/general'} className='block border-b text-black hover:bg-blue-700 hover:text-white pr-10 pl-2 py-1 duration-300'>All Courses</Link>
                      
                      {isLoggedIn ?
                        <div className='space-y-1'>
                            <Link to={'/course/personal'}  className='block border-b text-black hover:bg-blue-700 hover:text-white pr-10 pl-2 py-1 duration-300'>My Courses</Link>
                          <Link to={'/feedbacks'} className='block border-b text-black hover:bg-blue-700 hover:text-white pr-10 pl-2 py-1 duration-300'>Feedback</Link>
                          <Link onClick={logout} className='block border-b text-black hover:bg-blue-700 hover:text-white pr-10 pl-2 py-1 duration-300'>Logout</Link>
                        </div> :
                          <Link to={'/signin'}  className='block border-b text-black hover:bg-blue-700 hover:text-white pr-10 pl-2 py-1 duration-300'>Sign In</Link>
                        }
                          {/* <Link to={'/requests'}  className='block border-b text-black hover:bg-blue-700 hover:text-white pr-10 pl-2 py-1 duration-300'>Request</Link> */}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Menu.Root>
                  </div>
              
                  {/* </Link> */}
                </div>
            </div>
        </nav>
    </>
        
    )
}

export default Nav;