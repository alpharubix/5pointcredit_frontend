import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function NotF() {
    const navigate = useNavigate()
    return (
        <>
            <main className="grid min-h-full w-full h-screen place-items-center bg-[#000080] px-6 py-24 sm:py-32 lg:px-8">
                <div className="text-center">
                    <p className=" text-red-500 px-8 py-8 text-5xl font-bold">404</p>
                    <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl">
                        Page not found
                    </h1>
                    <p className="mt-6 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
                        Sorry, we couldn’t find the page you’re looking for.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <a
                            onClick={() => navigate("/home/dashboard")}
                            className="cursor-pointer flex items-center justify-center gap-x-1 rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go back home
                        </a>
                    </div>
                </div>
            </main>
        </>
    )
}
