# I-Ready Utils

![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Compatible-orange)
![Platform](https://img.shields.io/badge/Platform-Web-blue)
![License](https://img.shields.io/badge/License-GPLv3-green)

> WARNING: This script only works with I-Ready Pro. It does not work with standard I-Ready.

## Overview

I-Ready Utils is a Tampermonkey-compatible and console-compatible script designed to enhance interaction with features available in I-Ready Pro.

The goal of this project is to provide simple, useful, and non-distracting utilities.

## Features

- Tampermonkey userscript support  
- Console script support via browser DevTools  
- Lightweight and fast execution  
## Compatibility

| Platform | Supported |
|----------|----------|
| I-Ready Pro | Yes |
| Standard I-Ready | No |
| Mobile apps | No |
| Offline usage | No |

## Installation

### Tampermonkey

1. Install Tampermonkey  
   https://www.tampermonkey.net/

2. Open the script file you want in the repository

3. Click the Raw button on GitHub

4. Tampermonkey will prompt installation

5. Click Install

6. Open I-Ready Pro and refresh the page

## Console Script

1. Open I-Ready Pro in your browser

2. Open Developer Tools  
   Windows: F12 or Ctrl + Shift + I  
   Mac: Cmd + Option + I  

3. Go to the Console tab

4. Paste the script you want, e.g [games.js](https://raw.githubusercontent.com/crazygamesfan0-glitch/I-Ready-Utils/refs/heads/main/games.js)

5. Press Enter

6. Close Devtools (To stop debugger)

## Usage Notes

- Runs entirely in the browser environment

## FAQ

**Does this modify I-Ready Pro or its servers?**  
No. The script operates on the client side only and does not modify server data or backend systems. It interacts with data that is already visible in the browser.

**Is this allowed to use?**  
Use depends on your school or organization's rules. This project does not bypass security or access private systems, so responsibility for usage is up to the user.

**Why does it only work on I-Ready Pro?**  
I-Ready Pro uses different structures and features compared to standard I-Ready. This script is built specifically around pro to re-add things from standard I-ready and make it better in general.

**Will this break after updates?**  
It can. If I-Ready Pro changes its internal structure, selectors, or response formats, parts of the script may stop working and may require updates.

**Do I need Tampermonkey to use it?**  
No. You can use it either as a Tampermonkey userscript or directly in the browser console.

**How do I hide the UI?**
Ctrl+H, but if you for some reason want to toggle showing/hiding it, it's Ctrl+H :>
