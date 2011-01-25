/* ***** BEGIN LICENSE BLOCK *****
 * Version: MIT/X11 License
 * 
 * Copyright (c) 2010 Erik Vold
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Contributor(s):
 *   Erik Vold <erikvvold@gmail.com> (Original Author)
 *   Greg Parris <greg.parris@gmail.com>
 *   Nils Maier <maierman@web.de>
 *
 * ***** END LICENSE BLOCK ***** */

const {classes: Cc, interfaces: Ci, utils: Cu, Constructor: ctor} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const PREF_BRANCH = Services.prefs.getBranch("extensions.restartless-restart.");
const PREFS = {
  key: "R",
  modifiers: "accel,alt"
};
const RESTART_FLAGS = Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart;
const RESTART_ACTION = "restart";

XPCOMUtils.defineLazyServiceGetter(
  this,
  "AppStartup",
  "@mozilla.org/toolkit/app-startup;1",
  "nsIAppStartup");

const SupportsBool = ctor(
  "@mozilla.org/supports-PRBool;1",
  "nsISupportsPRBool");

let logo = "";

(function(global) global.include = function include(src) (
    Services.scriptloader.loadSubScript(src, global)))(this);

function getPref(aName) {
  try {
    return PREF_BRANCH.getComplexValue(aName, Ci.nsISupportsString).data;
  } catch(e) {}
  return PREFS[aName];
}

function restart() {
  // Application shutdown sequence
  // First ask observers if a restart is fine with them
  let canceled = new SupportsBool();
  Services.obs.notifyObservers(
    canceled,
    "quit-application-requested",
    RESTART_ACTION);
  if (canceled.data)
    return false; // somebody canceled our quit request

  // Then notify observers that the quit/restart is happening
  Services.obs.notifyObservers(
    null,
    "quit-application-granted",
    RESTART_ACTION);

  // Finally restart
  AppStartup.quit(RESTART_FLAGS);

  return true;
}

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
