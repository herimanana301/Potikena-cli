# Potikena - Your Ultimate Media CLI

Potikena is a versatile command-line tool that allows you to perform a variety of media tasks efficiently. From downloading videos to converting and manipulating images and PDFs, Potikena provides a simple interface to handle all your media needs.



💡 **Important Note: The first launch may take some time as necessary resources are being loaded.** 💡



![Potikena ScreenShot](./screenshot/main.png)

## Disclaimer
Potikena is an experimental tool intended for personal use only. The developer (Herimanana Rasolonirina) is not responsible for any misuse of the tool. Users should comply with the terms of service of the respective platforms.


## Features

### Online features
- Download videos from Facebook, Instagram, TikTok, YouTube.
- Convert YouTube videos to MP3 format.
### Offline features (no internet required)
- Remove the background from images. 
- Convert images to different formats (PNG, JPEG, WEBP, AVIF, TIFF, GIF).
- Convert images to PDF.
- Merge multiple PDFs into a single file.

## Upcoming features
[ ] Add watermark to images or PDFs.
[ ] Ability to provide arguments directly when calling `potikena`, skipping interactive prompts.



## Installation

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

In your prefered directory :
```bash
git clone git@github.com:herimanana301/Potikena-cli.git

```

```bash
npm install

```
To install it globally
```bash
npm install -g 

```
if you are on windows, please do this before installing it globally ( other case it will give error message )
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

```
*More information about Set-ExecutionPolicy of windows [here](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy?view=powershell-7.4)
## Usage
Launch the tool using this command

```bash
potikena
# May take some time as necessary resources are being loaded.
```
