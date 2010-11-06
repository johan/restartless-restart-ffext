const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");

let cleanupAry = [];

function restart() (
    Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup)
        .quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart));

function main(win) {
  let doc = win.document;

  // add hotkey
  let restartKey = doc.createElement("key");
  restartKey.setAttribute("id", "RR:Restart");
  restartKey.setAttribute("key", "R");
  restartKey.setAttribute("modifiers", "accel,alt");
  restartKey.setAttribute("oncommand", "void(0);");
  restartKey.addEventListener("command", restart, true);
  let mainKS = doc.getElementById("mainKeyset");
  mainKS.appendChild(restartKey);

  // add menu item
  let restartMI = doc.createElement("menuitem");
  restartMI.setAttribute("id", "menu_FileRestartItem");
  restartMI.setAttribute("label", "Restart");
  restartMI.setAttribute("accesskey", "R");
  restartMI.setAttribute("key", "RR:Restart");
  restartMI.addEventListener("command", restart, true);
  let fileMenu = doc.getElementById("menu_FilePopup");
  fileMenu.insertBefore(restartMI, doc.getElementById("menu_FileQuitItem"));

  let idx1 = cleanupAry.push(function() {
    mainKS.removeChild(restartKey);
    fileMenu.removeChild(restartMI);
  }) - 1;
  let idx2 = cleanupAry.push(function() (
      win.removeEventListener("unload", winUnloader, false))) - 1;
  function winUnloader() {
    cleanupAry[idx1] = null;
    cleanupAry[idx2] = null;
  }
  win.addEventListener("unload", winUnloader, false);
}

function startup() {
  let browserWins = Services.wm.getEnumerator("navigator:browser");
  while (browserWins.hasMoreElements()) main(browserWins.getNext());

  function winObs(aSubject, aTopic) {
    if ("domwindowopened" != aTopic) return;
    let winLoad = function() {
      aSubject.removeEventListener("load", winLoad, false);
      if ("navigator:browser" ==
          aSubject.document.documentElement.getAttribute("windowtype"))
        main(aSubject);
    }
    aSubject.addEventListener("load", winLoad, false);
  }
  Services.ww.registerNotification(winObs);
  cleanupAry.push(function() Services.ww.unregisterNotification(winObs));
}
function shutdown() {
  for (let [, cleaner] in Iterator(cleanupAry)) cleaner && cleaner();
}
