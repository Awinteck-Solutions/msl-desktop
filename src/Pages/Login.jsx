import { Link } from "react-router-dom"


const Login = ()=>{


    return(
        <div>
            <div className="md:grid md:gap-1 md:w-3/5 max-w-[400px]  bg-gray-100 p-1 rounded-2xl mx-auto my-10">
                
                <div className='p-10 bg-white rounded-xl text-center border'>
                    <div className='p-10'>
                        <img  className=" object-fill w-28 m-auto" src="/mslogo.png" alt="savings image" />
                    </div>
                    <div className="text-left space-y-2">
                        <p className='font-bold text-center text-lg'>Welcome back!</p>
                       
                        <ol type="numberic" className="text-left text-sm">
                            <li> 1. Open your mobile app</li>
                            <li> 2. Visit Menu tab </li>
                            <li> 3. Click Windows App Login</li>
                            <li> 4. Scan the Generated Code to Login</li>
                        </ol>
                    
                    </div>
                    <button className="bg-blue-700 hover:bg-blue-800 duration-200 w-full p-2 mt-6 rounded text-white"> Login </button>
                </div>
                <p className="text-center text-red-600 text-sm font-bold">NB:You require the mobile app to login</p>
            </div>
        </div>
    )
}
export default Login