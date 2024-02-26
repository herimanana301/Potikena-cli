import { downloader } from "../engine/downloader.js"
const choices = document.querySelectorAll(".choice")
const formInput = document.querySelector("form")
const stateSection = document.querySelector("#downloadinformation")
const stateLoading  = document.createElement("p")

let selectedPlatform = "Instagram";

choices.forEach(element => {
    element.addEventListener("click",function(event){
        choices.forEach((otherDiv) => {
            otherDiv.classList.remove('active');
        });
        element.classList.add('active');
        selectedPlatform = element.children[1].innerHTML
    })
});

formInput.addEventListener("submit",(e)=>{
    e.preventDefault()
    const url = document.getElementById("urlinput")
    downloader(selectedPlatform, url)
})