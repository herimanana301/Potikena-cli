import inquirer from "inquirer";
import gradient from "gradient-string";
import figlet from "figlet";
import { downloader } from "./downloader.js";
import * as os from "os"
import * as path from "path"
const goSleep = () => new Promise((r)=>setTimeout(r,100))

export async function welcome(){
    const welcomeMessage = "POTIKENA"
    figlet(welcomeMessage,(err,data)=>{
        console.log(gradient.pastel.multiline(data))
    })
    await goSleep()

    console.log(`
Welcome to Potikena - Your Ultimate Video Downloader CLI!
Potikena is here to make video downloading from various social media platforms a breeze. 
Whether it's a captivating Facebook/Instagram Video, an entertaining TikTok video, or a must-watch YouTube clip, Potikena has you covered!

By Herimanana Rasolonirina
    `)
}

const downloadDir = path.join(os.homedir(), 'Downloads');

export async function mediaChoice(){
    const choice = await inquirer.prompt({
        name:"Platform",
        type:"list",
        message:"Select the platform :",
        choices:["Facebook","Instagram","TikTok","YouTube","(exit)"],

    })
    if(choice.Platform==="(exit)"){
        process.exit(0)
       }
    const link = await inquirer.prompt({
        name:"link",
        type:"text",
        message:"Enter URL :",
    })
    const path = await inquirer.prompt({
        name:"path",
        type:"text",
        message:"Enter the path of download :",
        default(){
            return(downloadDir)
        }
    })

    downloader(choice.Platform,link.link, path.path) 
}

