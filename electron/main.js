const { app, BrowserWindow, ipcMain, dialog, Menu, Notification, webContents, shell } = require('electron');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const log = require('electron-log');
const os = require('os');

let win;

const creatWindow = () => {
    win = new BrowserWindow({
        title: 'MSL Business School',
        width: 1400,
        height: 1000,
        icon: path.join(__dirname, '../public/mslogo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    const urlPath = url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: process.platform !== 'darwin' ? 'file' : '',
        slashes: true,
    });

    let appPath = path.join(__dirname, '../dist/index.html');
    console.log('appPath :> ', appPath, urlPath);
    win.loadFile(appPath);

    win.webContents.openDevTools();
};

const template = [];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

if (process.platform === 'win32') app.setAppUserModelId(app.name);

const downloadFolder = 'dtzsWd4Aszwp';
const encryptFolder = 'e2QgtJvZty';
const tempFolder = 'tmU9G7mhdEx';
const downloadFolderPath = path.join(app.getPath('userData'), downloadFolder);
const encryptFolderPath = path.join(app.getPath('userData'), encryptFolder);
const tempFolderPath = path.join(app.getPath('userData'), tempFolder);

async function downloadFile(url, outputPath, onProgress) {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;

    response.data.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = Math.round((downloadedSize / totalSize) * 100);
        if (onProgress) {
            onProgress(progress);
        }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(outputPath));
        writer.on('error', reject);
    });
}

const encryptionKey = 'key-123456765-sdfgh-2345-234';

const encryptFile = (inputFile, outputFile) => {
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    const input = fs.createReadStream(inputFile);
    const output = fs.createWriteStream(outputFile);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
        console.log(`File encrypted and saved to ${outputFile}`);
        fs.unlinkSync(inputFile);
        console.log('Original file deleted');
    });
};

const decryptFile = (inputFile, outputFile) => {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    const input = fs.createReadStream(inputFile);
    const output = fs.createWriteStream(outputFile);

    input.pipe(decipher).pipe(output);

    output.on('finish', () => {
        win.webContents.send('getDecrypt', outputFile);
        console.log(`File decrypted and saved to ${outputFile}`);
    });
};

const decryptFilePdf = (inputFile, outputFile) => {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    const input = fs.createReadStream(inputFile);
    const output = fs.createWriteStream(outputFile);

    input.pipe(decipher).pipe(output);

    output.on('finish', () => {
        win.webContents.send('getDecrypt-pdf', outputFile);
        console.log(`File decrypted and saved to ${outputFile}`);
    });
};

const getFilesInFolder = (folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        return files.filter(file => fs.statSync(path.join(folderPath, file)).isFile());
    } catch (error) {
        console.error('Error reading folder:', error);
        return [];
    }
};

const createFolderIfNotExists = (folderPath) => {
    try {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`Folder created at: ${folderPath}`);
        } else {
            console.log('Folder already exists.');
        }
    } catch (error) {
        console.error('Error creating folder:', error);
    }
};

const showDownloadSuccessDialog = () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Download Successful',
        message: 'Your file has been downloaded successfully!',
        buttons: ['OK'],
    }).then(result => {
        console.log('Dialog closed', result.response);
    }).catch(err => {
        console.error('Error showing dialog:', err);
    });
};

const showDownloadStartedNotification = (fileName) => {
    const notification = new Notification({
        title: 'Download Started',
        body: `Your download has started.`,
        icon: path.join(__dirname, '../assets/mslogo.ico'),
    });

    notification.show();

    notification.on('click', () => {
        console.log('Notification clicked');
    });
};

const showDownloadDeletedNotification = (fileName, status) => {
    const notification = new Notification({
        title: status === 'success' ? 'Download Deleted' : 'Deletion Failed',
        body: status === 'success' ? `Your file has been deleted.` : `Your file could not be deleted. Please try again later.`,
        icon: path.join(__dirname, '../assets/mslogo.ico'),
    });

    notification.show();

    notification.on('click', () => {
        console.log('Notification clicked');
    });
};

const deleteDecryptedFiles = () => {
    try {
        const folderPath = tempFolderPath;
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath);
            files.forEach(file => {
                const filePath = path.join(folderPath, file);
                const stat = fs.lstatSync(filePath);

                if (stat.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
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
app.on('render-process-gone', (event, webContents, details) => {
    console.log('render process gone:', details);
});

app.whenReady().then(() => {
    creatWindow();
    log.info('App started...');
    createFolderIfNotExists(downloadFolderPath);
    createFolderIfNotExists(encryptFolderPath);
    createFolderIfNotExists(tempFolderPath);

    win.webContents.send('system-data', { platform: os.platform() });
    console.log('resources', os.platform());

    ipcMain.on('getDownloadedList', (event, data) => {
        const fileNames = getFilesInFolder(encryptFolderPath);
        win.webContents.send('downloadedList', fileNames);
        console.log('fileNames :>> ', fileNames);
    });

    ipcMain.on('dashboard', (event, data) => {
        console.log('Received data in main process:', data);
    });

    ipcMain.on('update-available', (event, data) => {
        console.log('update-available here');
        if (data.startsWith('http')) {
            event.preventDefault();
            shell.openExternal(data);
        }
    });

    ipcMain.on('delete-download', async (event, data) => {
        const filePath = path.join(encryptFolderPath, `${data.filename}.enc`);
        try {
            console.log('filePath :>> ', filePath);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    showDownloadDeletedNotification(data.filename, 'failed');
                } else {
                    showDownloadDeletedNotification(data.filename, 'success');
                    console.log(`File deleted successfully: ${filePath}`);
                    win.webContents.send('delete-complete', true);
                }
            });
        } catch (error) {
            console.log('error :>> ', error);
            showDownloadDeletedNotification(data.filename, 'failed');
        }
    });

    ipcMain.on('download', async (event, data) => {
        try {
            showDownloadStartedNotification(data.filename);
            console.log('data.filename :>> ', data.filename);

            const outputPath = path.join(downloadFolderPath, data.filename);

            await downloadFile(
                data.url,
                outputPath,
                (progress) => {
                    win.webContents.send('download-progress', { filename: data.filename, progress });
                }
            );

            console.log('File downloaded to:', outputPath);

            win.webContents.send('download-complete', { filename: data.filename, outputPath });

            try {
                await encryptFile(outputPath, `${encryptFolderPath}/${data.filename}.enc`);
                console.log('File encrypted successfully');
                showDownloadSuccessDialog();
            } catch (encryptionError) {
                console.error('Error encrypting file:', encryptionError);
                win.webContents.send('encryption-failed', { filename: data.filename, error: encryptionError });
            }
        } catch (downloadError) {
            console.error('Error downloading file:', downloadError);
            win.webContents.send('download-failed', { filename: data.filename, error: downloadError });
        }
    });

    ipcMain.on('decrypt', (event, data) => {
        console.log('-------------------DECRYPT decrypt:', data);
        let formatFileName = data.split('/')[1];
        let filename = `${formatFileName}.enc`;
        console.log('filename :>> ', filename, `${tempFolderPath}/${filename}`);
        decryptFile(`${encryptFolderPath}/${filename}`, `${tempFolderPath}/${formatFileName}`);
    });

    ipcMain.on('decrypt-pdf', (event, data) => {
        console.log('-------------------DECRYPT decrypt pdf:', data);
        let formatFileName = data.split('/')[1];
        let filename = `${formatFileName}.enc`;
        console.log('filename :>> ', filename, `${tempFolderPath}/${filename}`);
        decryptFilePdf(`${encryptFolderPath}/${filename}`, `${tempFolderPath}/${formatFileName}`);
    });

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

        pdfWindow.loadFile(pdfViewerPath, {
            query: { pdfPath },
        });

        pdfWindow.webContents.on('will-navigate', (event) => {
            event.preventDefault();
        });

        pdfWindow.webContents.on('new-window', (event) => {
            event.preventDefault();
        });

        pdfWindow.webContents.on('context-menu', (event) => {
            event.preventDefault();
        });
    });

    win.on('blur', () => {
        console.log('App inactive, cleaning up decrypted files.');
        deleteDecryptedFiles();
    });

    log.info('Done -App started...');
});

app.on('before-quit', deleteDecryptedFiles);
app.on('window-all-closed', () => {
    deleteDecryptedFiles();
    if (process.platform !== 'darwin') app.quit();
    log.info('App closed...');
});

process.on('uncaughtException', (error) => {
    console.log(error);
    dialog.showErrorBox('Application Error', 'Something went wrong');
});

process.on('unhandledRejection', (reason, promise) => {
    dialog.showErrorBox('Application Error', 'Unexpected error occurred ' + reason);
});

app.on('render-process-gone', (event, webContents, killed) => {
    dialog.showErrorBox('Application Error', 'Please restart app');
});