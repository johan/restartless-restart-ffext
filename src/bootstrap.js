const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const PREF_BRANCH = Services.prefs.getBranch("extensions.restartless-restart.");
const PREFS = {
  key: "R",
  modifiers: "accel,alt"
};
let logo = "";

(function(global) global.include = function include(src) (
    Services.scriptloader.loadSubScript(src, global)))(this);

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
    restartAMI.style.listStyleImage = "url('" + logo + "')";
    restartAMI.addEventListener("command", restart, true);
    appMenu.insertBefore(restartAMI, $("appmenu-quit"));
  }

  unload(function() {
    mainKS.removeChild(restartKey);
    fileMenu.removeChild(restartMI);
    appMenu && appMenu.removeChild(restartAMI);
  }, win);
}

function install(){}
function uninstall(){}
function startup(data) AddonManager.getAddonByID(data.id, function(addon) {
  include(addon.getResourceURI("includes/utils.js").spec);
  logo = addon.getResourceURI("images/refresh_16.png").spec;
  watchWindows(main);
});
function shutdown(data, reason) { if (reason !== APP_SHUTDOWN) unload(); }
