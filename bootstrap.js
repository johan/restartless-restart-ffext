const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");

let cleanupAry = [];

function restart() {
  Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup)
      .quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
}

function main(win) {
  let doc = win.document;
  let restartMI = doc.createElement("menuitem");
  let fileMenu = doc.getElementById("menu_FilePopup");
  let quitMI = doc.getElementById("menu_FileQuitItem");
  restartMI.setAttribute("id", "menu_FileRestartItem");
  restartMI.setAttribute("label", "Restart");
  restartMI.setAttribute("accesskey", "R");
  restartMI.addEventListener("command", restart, true);
  fileMenu.insertBefore(restartMI, quitMI);

  let idx1 = cleanupAry.push(function() fileMenu.removeChild(restartMI)) - 1;
  let idx2 = cleanupAry.push(function() (
      win.removeEventListener("unload", winUnloader, false))) - 1;
  function winUnloader() {
    cleanupAry[idx1] = null;
    cleanupAry[idx2] = null;
  }
  win.addEventListener("unload", winUnloader, false);
}

function findWindowsAndRun(aFunc) {
  let browserWins = Services.wm.getEnumerator("navigator:browser");
  while (browserWins.hasMoreElements()) aFunc(browserWins.getNext());

  function winObs(aSubject, aTopic) {
    if ("domwindowopened" != aTopic) return;
    let winLoad = function() {
      aSubject.removeEventListener("load", winLoad, false);
      if ("navigator:browser" ==
          aSubject.document.documentElement.getAttribute("windowtype"))
        aFunc(aSubject);
    }
    aSubject.addEventListener("load", winLoad, false);
  }
  Services.ww.registerNotification(winObs);
  cleanupAry.push(function() Services.ww.unregisterNotification(winObs));
}

function startup() findWindowsAndRun(main);
function shutdown() {
  for (let [, cleaner] in Iterator(cleanupAry)) cleaner && cleaner();
}
