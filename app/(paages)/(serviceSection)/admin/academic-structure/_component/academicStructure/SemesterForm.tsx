// import React, { useState } from 'react'
// import { Level, Semester } from './AcademicStructure'
// import { ChevronDownIcon, ChevronUpIcon, Loader } from 'lucide-react'
// import { v4 as uuidv4} from 'uuid'
// import { toast } from 'sonner'
// interface SemesterFormProps {
//   levels: Level[]
//   onSemesterCreated: (semester: Semester | Semester[]) => void
// }
// export const SemesterForm = ({
//   levels,
//   onSemesterCreated,
// }: SemesterFormProps) => {
//   const [isExpanded, setIsExpanded] = useState(true)
//   const [formData, setFormData] = useState({
//     name: '',
//     number: '',
//     levelId: 'all',
//   })
//   const [isLoading, setIsLoading] = useState(false)
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
    
//   }
//   return (
//     <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
//       <div
//         className="flex items-center justify-between cursor-pointer"
//         onClick={() => setIsExpanded(!isExpanded)}
//       >
//         <h2 className="text-lg font-semibold text-gray-800">Create Semester</h2>
//         <button className="text-gray-500 hover:text-gray-700">
//           {isExpanded ? (
//             <ChevronUpIcon size={20} />
//           ) : (
//             <ChevronDownIcon size={20} />
//           )}
//         </button>
//       </div>
//       {isExpanded && (
//         <form onSubmit={handleSubmit} className="mt-4 space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <input
//                 type="text"
//                 placeholder="Semester Name"
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     name: e.target.value,
//                   })
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//               />
//             </div>
//             <div>
//               <input
//                 type="number"
//                 placeholder="Semester Number"
//                 value={formData.number}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     number: e.target.value,
//                   })
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//               />
//             </div>
//             <div>
//               <select
//                 value={formData.levelId}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     levelId: e.target.value,
//                   })
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//               >
//                 <option value="all">All Levels (General)</option>
//                 {levels.map((level) => (
//                   <option key={level._id} value={level._id}>
//                     {level.name} (Level {level.number})
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//           <div>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="px-4 py-2 disabled:cursor-not-allowed disabled:flex disabled:bg-purple-400 disabled:items-center bg-purple-600 text-white rounded-md hover:bg-purple-700"
//             >
//               {isLoading && <Loader className='animate-spin duration-300 mr-2'size={16}/> }
//               Create Semester
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   )
// }
