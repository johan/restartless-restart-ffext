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

  // add menu bar item
  let restartMI = doc.createElement("menuitem");
  restartMI.setAttribute("id", "menu_FileRestartItem");
  restartMI.setAttribute("label", "Restart");
  restartMI.setAttribute("accesskey", "R");
  restartMI.setAttribute("key", "RR:Restart");
  restartMI.addEventListener("command", restart, true);
  let fileMenu = doc.getElementById("menu_FilePopup");
  fileMenu.insertBefore(restartMI, doc.getElementById("menu_FileQuitItem"));
  
  // add app (Firefox button) menu item
  let restartAMI = doc.createElement("menuitem");
  restartAMI.setAttribute("id", "appmenu_RestartItem");
  restartAMI.setAttribute("label", "Restart");
  restartAMI.setAttribute("accesskey", "R");
  restartAMI.setAttribute("key", "RR:Restart");
  restartAMI.setAttribute("class", "menuitem-iconic menuitem-iconic-tooltip");
  restartAMI.style.listStyleImage =
      "url('http://picol.org/images/icons/files/png/16/refresh_16.png')";
  restartAMI.addEventListener("command", restart, true);
  let appMenu = doc.getElementById("appmenuPrimaryPane");
  appMenu.insertBefore(restartAMI, doc.getElementById("appmenu-quit"));

  let idx1 = cleanupAry.push(function() {
    mainKS.removeChild(restartKey);
    fileMenu.removeChild(restartMI);
    appMenu.removeChild(restartAMI);
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
