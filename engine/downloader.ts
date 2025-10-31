import pkg from "nayan-media-downloader"
import { createSpinner } from "nanospinner";
import * as rdm from "randomstring"
import * as https from 'https';
import * as fs from "fs"
import * as os from "os"
import * as path from "path"
const {ndown, ytdown, tikdown} = pkg


function httpGet(result:any,path:string){
    const downloadLoader = createSpinner("Downloading the file, please let me cook...").start()
    const downloadLink = result.data[0] ? result.data[0].url : result.data.video 

   https.get(downloadLink, (res) => {
       const writeStream = fs.createWriteStream(path+`/${result.data.title||rdm.generate()}.mp4`);
       res.pipe(writeStream);
       writeStream.on("finish", () => {
          writeStream.close();
          downloadLoader.success({text:`✅ File successfully downloaded at '${path}'`})
          process.exit(0)
       })
    }).on('error',(err)=>{
       downloadLoader.error({text:"An error occured during downloading, please try later"})
       process.exit(1)
    })
}
const downloadDir = path.join(os.homedir(), 'Downloads');
export async function downloader (choice:string,url:string,path=downloadDir){
    // there is a defautl path in case where the user use the chrome extension
        let result
        const retriveLoader = createSpinner("Fetching data, please wait...").start()
        switch(choice.toLowerCase()){
            case "instagram": 
                result = await ndown(url)
                break;
            case "facebook" :
                result = await ndown(url)
                break;
            case "youtube" :
                result = await ytdown(url)
                break;
            case "tiktok" :
                result = await tikdown(url)
                break;
            default :
                console.error("Please select an option.")
                break;
        }
        
         if(result.status){
            retriveLoader.success({text:"✅ Data successfully retrieved!"})
            httpGet(result,path)

       }else{
            retriveLoader.error({text: url.length<1 ? "You did not provide URL" : result.msg})
            process.exit(1)
        }
    }

