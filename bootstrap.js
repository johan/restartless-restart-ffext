const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const PREF_BRANCH = Services.prefs.getBranch("extensions.restartless-restart.");
const PREFS = {
  key: "R",
  modifiers: "accel,alt"
};
let cleanupAry = [];

function getPref(aName) {
  try {
    return PREF_BRANCH.getComplexValue(aName, Ci.nsISupportsString).data;
  } catch(e) {}
  return PREFS[aName];
}

function restart() (
    Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup)
        .quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart));

function main(win) {
  let doc = win.document;
  function $(id) doc.getElementById(id);

  // add hotkey
  let restartKey = doc.createElementNS(NS_XUL, "key");
  restartKey.setAttribute("id", "RR:Restart");
  restartKey.setAttribute("key", getPref("key"));
  restartKey.setAttribute("modifiers", getPref("modifiers"));
  restartKey.setAttribute("oncommand", "void(0);");
  restartKey.addEventListener("command", restart, true);
  let mainKS = $("mainKeyset");
  mainKS.appendChild(restartKey);

  // add menu bar item to File menu
  let restartMI = doc.createElementNS(NS_XUL, "menuitem");
  restartMI.setAttribute("id", "menu_FileRestartItem");
  restartMI.setAttribute("label", "Restart");
  restartMI.setAttribute("accesskey", "R");
  restartMI.setAttribute("key", "RR:Restart");
  restartMI.addEventListener("command", restart, true);
  let fileMenu = $("menu_FilePopup");
  fileMenu.insertBefore(restartMI, $("menu_FileQuitItem"));

  // add app menu item to Firefox button for Windows 7
  let appMenu = $("appmenuPrimaryPane"), restartAMI;
  if (appMenu) {
    restartAMI = restartMI.cloneNode(false);
    restartAMI.setAttribute("id", "appmenu_RestartItem");
    restartAMI.setAttribute("class", "menuitem-iconic menuitem-iconic-tooltip");
    restartAMI.style.listStyleImage =
        "url('http://picol.org/images/icons/files/png/16/refresh_16.png')";
    restartAMI.addEventListener("command", restart, true);
    appMenu.insertBefore(restartAMI, $("appmenu-quit"));
  }

  let idx1 = cleanupAry.push(function() {
    mainKS.removeChild(restartKey);
    fileMenu.removeChild(restartMI);
    appMenu && appMenu.removeChild(restartAMI);
  }) - 1;
  let idx2 = cleanupAry.push(function() (
      win.removeEventListener("unload", winUnloader, false))) - 1;
  function winUnloader() {
    cleanupAry[idx1] = null;
    cleanupAry[idx2] = null;
  }
  win.addEventListener("unload", winUnloader, false);
}

function install(){}
function uninstall(){}
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
function shutdown(data, reason) {
  if (reason !== APP_SHUTDOWN)
    for (let [, cleaner] in Iterator(cleanupAry)) cleaner && cleaner();
}
