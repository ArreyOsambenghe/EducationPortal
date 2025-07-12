export type FileUploadMetada={
    id: string;
    originalName: string;
    fileName: string;
    fileUrl: string;
    size: number;
    type: string;
    extension: string;
    uploadDate: string;
}
export class UploadService{
    private static api = `${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`

    static async uploadFile(file:File){
        const formData = new FormData();
        formData.append('file', file);
        const response  = await fetch(`${this.api}`, {
            method: 'POST',
            body: formData
        })

        if(response.ok){
            const {metadata}:{metadata:FileUploadMetada}  =  await response.json()
            return {success:true,metadata }
        }
        else{
            return {success:false}
        }
    }
}