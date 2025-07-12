export const htmlTag = [
  {tag:'P',html:`<p>`},
  {tag:'ENDP',html:`</p>`},
  {tag:'LIST',html:`<ul>`},
  {tag:'ENDLIST',html:`</ul>`},
  {tag:'ITEM',html:`<li>`},
  {tag:'ENDITEM',html:`</li>`},
  {tag:'EMPHASIS',html:`<em>`},
  {tag:'ENDEMPHASIS',html:`</em>`},
  {tag:'UL',html:`<span className='underline'>`},
  {tag:'ENDUL',html:`</span>`},
  {tag:'CODE',html:`<code>`},
  {tag:'BB',html:`<strong>`},
  {tag:'ENDBB',html:`</strong>`},
  {tag:'ENDCODE',html:`</code>`},
  {tag:'RESPONSE',html:`<div>`},
  {tag:'ENDRESPONSE',html:`</div>`},
  {tag:'ENDQUESTION',html:''},
  {tag:'ENDCONVERSATION',html:''}
]

export default function Parser(text:string){
text = text.split('__').join('//')
    let loop = true
    let status = false
    while(loop){

      htmlTag.sort((a,b) => b.tag.length - a.tag.length).map((t,i) => {
          text= text.replaceAll(t.tag,t.html);
      });
      htmlTag.sort((a,b) => b.tag.length - a.tag.length).map((t,i) => {
        if(text.includes(t.tag)){
          status = true
        }
      })
      if(!status){
        loop = false
      }
    }
      text = text.split('//').join('')
      return text
}