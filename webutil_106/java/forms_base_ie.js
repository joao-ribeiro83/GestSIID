/*
** FILE: forms_base_ie.js
**
** This java script file gets included in the Forms Servlet template
** file base.htm, baseie.htm.
**
** Users who have customized replacements for these template files 
** (base.htm) should modify their customized template files and include this 
** java script (similiar to the default template files base.htm).
*/

var plugin_info = document.getElementById("forms_plugin_info");
var jcodebase = plugin_info.getAttribute("appcodebase");
var jarchive  = plugin_info.getAttribute("apparchive");
var jwidth = plugin_info.getAttribute("appwidth");
var jheight = plugin_info.getAttribute("appheight");

document.write('<APPLET CODEBASE="' + jcodebase + '"\n');
document.write('CODE="oracle.forms.engine.Main"\n');
document.write('ARCHIVE="' + jarchive + '"\n');
document.write('WIDTH="' + jwidth + '"\n');
document.write('HEIGHT="' + jheight + '">\n');








