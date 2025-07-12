import { Loader } from "lucide-react"
import { useState } from "react"
import { addDepartment, updateDepartment } from "../admin.action"
import { toast } from "sonner"
import { errorMessage } from "@/app/api/course/route"
import { set } from "lodash"

const DepartmentModal = ({
  isOpen,
  Data,
  onUpdate,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: {
    _id: string
    name: string
    slug: string
    departmentHeadName: string
    departmentHeadEmail: string
  }) => void,
  Data:{
    _id: string
    name: string
    slug: string
    departmentHeadName: string
    departmentHeadEmail: string
  }| null
  onUpdate: (formData: {
    _id: string
    name: string
    slug: string
    departmentHeadName: string
    departmentHeadEmail: string
  }) => void
}) => {
  const [formData, setFormData] = useState(Data !== null ? {...Data,slug:Data.name.toLowerCase().replace(/\s+/g, '-')} :{
    _id:undefined,
    name: '',
    slug: '',
    departmentHeadName: '',
    departmentHeadEmail: '',
  })
  console.log(formData)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      slug: name === 'name' ? value.toLowerCase().replace(/\s+/g, '-') : prev.slug,
    }))
  }
  const [isLoading,setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if(formData.name === '' || formData.departmentHeadName === '' || formData.departmentHeadEmail === '') return
    setLoading(true)
    if(!Data){
        const res = await addDepartment(formData)
        if(res.success && res.result){
        onSubmit({...formData,_id:res.result._id})
        toast.success("Department added successfully");
        }else{
        toast.error(errorMessage(res.error ? res.error : {}).message);
        }
    }
    else{
        if(!formData._id) {
            toast.success("No id found");
            return
        }
        const res = await updateDepartment(formData)
        if(res.success && res.result){
        onUpdate({...formData,_id:res.result._id})
        toast.success("Department updated successfully");
        }else{
        toast.error(errorMessage(res.error ? res.error : {}).message);
        }
    }
    setFormData({
        _id:undefined,
      name: '',
      slug: '',
      departmentHeadName: '',
      departmentHeadEmail: '',
    })
    setLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/10 flex justify-center items-center ">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">{Data ? 'Update':'Add'} Department</h2>
        <div className="space-y-3">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Department Name"
            className="w-full border px-3 py-2 rounded-lg"
          />
          <input
            name="slug"
            value={formData.slug}
            disabled
            className="w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-500"
          />
          <input
            name="departmentHeadName"
            value={formData.departmentHeadName}
            onChange={handleChange}
            placeholder="Department Head Name"
            className="w-full border px-3 py-2 rounded-lg"
          />
          <input
            name="departmentHeadEmail"
            value={formData.departmentHeadEmail}
            onChange={handleChange}
            placeholder="Department Head Email"
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <button onClick={onClose}  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 disabled:flex items-center disabled:bg-blue-400 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {isLoading && <Loader size={16} className="animate-spin duration-300 mr-2"/>}
            {Data ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}
export default DepartmentModal