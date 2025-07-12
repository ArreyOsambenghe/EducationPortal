// import React, { useState } from 'react'
// import { Loader, PlusIcon, TrashIcon } from 'lucide-react'
// import { Level } from './AcademicStructure'
// import { toast } from 'sonner'
// interface LevelFormProps {
//   onLevelsCreated: (levels: Level[]) => void
// }
// interface LevelInput {
//   name: string
//   number: string
// }
// export const LevelForm = ({ onLevelsCreated }: LevelFormProps) => {
//   const [levelInputs, setLevelInputs] = useState<LevelInput[]>([
//     {
//       name: '',
//       number: '',
//     },
//   ])
//   const [isLoading,setIsLoading] = useState(false)
//   const handleAddLevel = () => {
//     setLevelInputs([
//       ...levelInputs,
//       {
//         name: '',
//         number: '',
//       },
//     ])
//   }
//   const handleRemoveLevel = (index: number) => {
//     setLevelInputs(levelInputs.filter((_, i) => i !== index))
//   }
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const newLevels: Level[] = levelInputs
//       .filter((input) => input.name && input.number)
//       .map((input) => ({
//         name: input.name,
//         number: parseInt(input.number),
//       }))
//     if (newLevels.length > 0) {
//       setIsLoading(true)
//       // const res = await addLevels(newLevels.map((level)=>({customName:level.name,customNumber:level.number,semesters:[]})))
//       // if(res.success){
//       //   toast.success('Levels added successfully')
//       //   onLevelsCreated(res.result ?res.result.map((level) => ({ name: level.customName, number: level.customNumber,_id:level._id })):[])
//       // }
//       // else{
//       //   toast.error(errorMessage(res.error ? res.error : {}).message)
//       //   console.log(res.error)
//       // }
//       setLevelInputs([
//         {
//           name: '',
//           number: '',
//         },
//       ])
//       setIsLoading(false)
//     }
//   }
//   return (
//     <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">
//         Create Levels
//       </h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         {levelInputs.map((input, index) => (
//           <div key={index} className="flex gap-4">
//             <div className="flex-1">
//               <input
//                 type="text"
//                 placeholder="Level Name"
//                 value={input.name}
//                 onChange={(e) => {
//                   const newInputs = [...levelInputs]
//                   newInputs[index].name = e.target.value
//                   setLevelInputs(newInputs)
//                 }}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//               />
//             </div>
//             <div className="flex-1">
//               <input
//                 type="number"
//                 placeholder="Level Number"
//                 value={input.number}
//                 onChange={(e) => {
//                   const newInputs = [...levelInputs]
//                   newInputs[index].number = e.target.value
//                   setLevelInputs(newInputs)
//                 }}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//               />
//             </div>
//             {levelInputs.length > 1 && (
//               <button
//                 type="button"
//                 onClick={() => handleRemoveLevel(index)}
//                 className="p-2 text-red-600 hover:bg-red-50 rounded-md"
//               >
//                 <TrashIcon size={20} />
//               </button>
//             )}
//           </div>
//         ))}
//         <div className="flex gap-4">
//           <button
//             type="button"
//             onClick={handleAddLevel}
//             className="flex items-center px-4 py-2 text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
//           >
//             <PlusIcon size={20} className="mr-2" />
//             Add Another Level
//           </button>
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="px-4 disabled:cursor-not-allowed disabled:bg-purple-400 disabled:flex disabled:items-center py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
//           >
//             {isLoading && <Loader size={16} className='animate-spin mr-2 duration-300'/>}
//             Create Levels
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }
