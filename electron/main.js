const { app, BrowserWindow, ipcMain, dialog, Notification} = require('electron')
const path = require('path')
const url = require('url')
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs')

let win;
const creatWindow = () => {
    win = new BrowserWindow({
        title:'MSL Business School',
        width: 1000,
        height: 800,
        icon: path.join(__dirname, '../public/mslogo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, 
            enableRemoteModule: false,
        }
    })

    const urlPath = url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: process.platform !== 'darwin'? 'file':'',
        slashes: true
    });

    let appPath = path.join(__dirname, '../dist/index.html')
    console.log('appPath :>> ', appPath, urlPath);
    win.loadFile(urlPath)
    win.webContents.openDevTools()
}




const downloadFolderPath = path.join(__dirname, 'downloadFolder');
const encryptFolderPath = path.join(__dirname, 'encryptFolder');
const decryptFolderPath = path.join(__dirname, 'decryptFolder');
const tempFolderPath = path.join(__dirname, 'tempFolderPath');


// Function to download a file
const downloadFile = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);
    
    // Use axios to fetch the file
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Download complete!');
        resolve(outputPath);
      });
  
      writer.on('error', (error) => {
        console.error('Download failed:', error);
        reject(error);
      });
    });
  };

    const encryptionKey = 'key-123456765-sdfgh-2345-234'

  // Encrypt the downloaded file
const encryptFile = (inputFile, outputFile) => {
  
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    const input = fs.createReadStream(inputFile);
    const output = fs.createWriteStream(outputFile);
  
    input.pipe(cipher).pipe(output);
  
    output.on('finish', () => {
      console.log(`File encrypted and saved to ${outputFile}`);
      // Optionally delete the original file after encryption
      fs.unlinkSync(inputFile);
      console.log('Original file deleted');
    });
};
  

// Function to decrypt a video file
const decryptFile = (inputFile, outputFile) => {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    const input = fs.createReadStream(inputFile);
    const output = fs.createWriteStream(outputFile);
  
    input.pipe(decipher).pipe(output);
  
    output.on('finish', () => {
        win.webContents.send('getDecrypt', outputFile)
      console.log(`File decrypted and saved to ${outputFile}`);
    });
};
  

const getFilesInFolder = (folderPath) => {
    try {
      const files = fs.readdirSync(folderPath);  // Read all files and directories
      // Filter out directories and return only file names
      return files.filter(file => fs.statSync(path.join(folderPath, file)).isFile());
    } catch (error) {
      console.error('Error reading folder:', error);
      return [];
    }
  };

const createFolderIfNotExists = (folderPath) => {
    try {
      // Check if the folder exists
      if (!fs.existsSync(folderPath)) {
        // If it doesn't exist, create it
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folder created at: ${folderPath}`);
      } else {
        console.log('Folder already exists.');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
};
  
// Function to show the success message box
const showDownloadSuccessDialog = () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Download Successful',
      message: 'Your file has been downloaded successfully!',
      buttons: ['OK']
    }).then(result => {
      // You can handle user response if needed
      console.log('Dialog closed', result.response);
    }).catch(err => {
      console.error('Error showing dialog:', err);
    });
};
  
// Function to show a "Download Started" notification
const showDownloadStartedNotification = (fileName) => {
    const notification = new Notification({
      title: 'Download Started',
      body: `Your download for "${fileName}" has started.`
    });
  
    notification.show();
  
    notification.on('click', () => {
      console.log('Notification clicked');
      // Optionally, handle notification clicks (e.g., open download manager)
    });
};
  


// Function to delete a folder and its contents
const deleteDecryptedFiles = () => {
    try {
        folderPath = tempFolderPath;
        if (fs.existsSync(folderPath)) {
          const files = fs.readdirSync(folderPath); // List all files and folders
          files.forEach(file => {
            const filePath = path.join(folderPath, file);
            const stat = fs.lstatSync(filePath);
    
            if (stat.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true }); // Delete subfolder
            } else {
              fs.unlinkSync(filePath); // Delete file
            }
          });
          console.log(`Contents of the folder "${folderPath}" deleted successfully.`);
        } else {
          console.log(`Folder does not exist: ${folderPath}`);
        }
      } catch (error) {
        console.error(`Error deleting contents of folder ${folderPath}:`, error);
      }
  };
  
app.disableHardwareAcceleration();
  
app.whenReady().then(() => {
    creatWindow()

    createFolderIfNotExists(downloadFolderPath)
    createFolderIfNotExists(encryptFolderPath)
    createFolderIfNotExists(tempFolderPath)
   
   

    //---------- Send data to the renderer process after 2 seconds
    setTimeout(() => {
        const data = { message: 'Hello from main.js!' };
        win.webContents.send('data-from-main', data);
      
    }, 2000);


    ipcMain.on('getDownloadedList', (event, data) => {
        const fileNames = getFilesInFolder(encryptFolderPath);
        win.webContents.send('downloadedList', fileNames)
        console.log('fileNames :>> ', fileNames);
     })


    //---------- Listen and receive data
    ipcMain.on('dashboard', (event, data) => {
        console.log('Received data in main process:', data);
        // Handle the received data here
    });
    
    ipcMain.on('download', (event, data) => {
        console.log('-------------------DOWNLOADER:', data);
        downloadFile(data.url, `${downloadFolderPath}/${data.filename}`).then((outputPath) => {
            console.log('File downloaded to:', outputPath);
            win.webContents.send('download-complete', outputPath);
            showDownloadStartedNotification(data.filename)
            encryptFile(outputPath, `${encryptFolderPath}/${data.filename}.enc`);
            showDownloadSuccessDialog()

        }).catch((error) => {
            console.error('Error downloading file:', error);
            win.webContents.send('download-failed', error);
            });
        // Handle the received data here
    });
    

    ipcMain.on('decrypt', (event, data)=> {
        console.log('-------------------DECRYPT decrypt:', data);
        let formatFileName = data.split('/')[1];
        let filename = `${formatFileName}.enc`
        

        console.log('filename :>> ', filename,  `${tempFolderPath}/${filename}`);
        decryptFile(`${encryptFolderPath}/${filename}`, `${tempFolderPath}/${formatFileName}`);
    })




    // Listen for the event to open a new PDF window
  ipcMain.on('open-pdf', (event, pdfPath) => {
    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        contextIsolation: true,
          nodeIntegration: false,
          sandbox: true, 
      },
    });
      
    const pdfViewerPath = path.join(__dirname, 'pdfViewer.html');
    console.log('PDF Viewer Path:', pdfViewerPath);
    console.log('PDF Path:', pdfPath);

    // Load pdfViewer.html with the PDF file path as a query parameter
    pdfWindow.loadFile(pdfViewerPath, {
      query: { pdfPath },
    });
      
    // pdfWindow.loadURL(
    //   url.format({
    //     pathname: path.resolve(pdfPath), // Resolve the absolute path to the PDF
    //     protocol: 'file:',
    //     slashes: true,
    //   })
    // );
      
          // Disable navigation to other URLs or downloading
    pdfWindow.webContents.on('will-navigate', (event) => {
        event.preventDefault(); // Prevent navigation
      });
  
      pdfWindow.webContents.on('new-window', (event) => {
        event.preventDefault(); // Prevent opening links in a new window
      });
  
      // Disable the context menu (e.g., right-click options)
      pdfWindow.webContents.on('context-menu', (event) => {
        event.preventDefault();
      });

      
  });


    // win.on('blur', () => {
    //     console.log('App inactive, cleaning up decrypted files.');
    //     deleteDecryptedFiles();
    //   });
    
})


app.on('before-quit', deleteDecryptedFiles);
app.on('window-all-closed', () => {
  deleteDecryptedFiles();
  if (process.platform !== 'darwin') app.quit();
});


