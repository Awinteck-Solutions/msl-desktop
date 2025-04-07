import { Link } from "react-router-dom"
import apiEndpoints from '../../Services/apiConfig'

export default function Item({image,title,date, category=[],description='',route='/course/general/'}) { 
    return <div>
        <div className="w-[300px] bg-white inline-block border shadow rounded-md h-fit p-2 hover:border hover:border-blue-400 duration-300">
            <div className="rounded bg-gray-200 h-[11rem]">
                <img className="h-full w-full object-cover" src={image} alt="" />
            </div>
            <div className=" relative space-y-2">
                <p className="font-bold text-black">{title}</p>
                <div className=" w-full">
                    <p className="text-sm text-gray-600">{description.substring(0,100) }...</p>
                </div>

                <div className="flex space-x-2">
                    {category.slice(0,3).map((value,index) => {
                        return <p key={index} className="text-[12px] cursor-default rounded border text-white bg-[#336699] p-1">{ value }</p>
                    })}
                </div>

                <div className="pt-5"></div>
                <p className="text-sm text-[#336699] font-extrabold uppercase">{date}</p>
                <Link className="absolute bottom-0 right-0 bg-gray-200 rounded-3xl px-3 py-[6px] hover:bg-[#336699] hover:text-white duration-200" to={route}>View Details</Link>
            </div>
        </div>
    </div>
}