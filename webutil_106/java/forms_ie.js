/*
** FILE: forms_base.js
**
** This java script file gets included in the Forms Servlet template htm
** files basejini.htm, basejpi.htm.
**
** Users who have customized replacements for these template htm files
** (basejpi.htm, basejpi.htm) should modify their customized template htm 
** files and include this java script (similiar to the default template files).
*/

var plugin_info = document.getElementById("forms_plugin_info");
var jversion = plugin_info.getAttribute("plug_ver");
var jcodebase = plugin_info.getAttribute("appcodebase");
var jwidth = plugin_info.getAttribute("appwidth");
var jheight = plugin_info.getAttribute("appheight");

document.write('<object classid="' + jversion + '"\n');
document.write('codebase="' + jcodebase + '"\n');
document.write('WIDTH="' + jwidth + '"\n');
document.write('HEIGHT="' + jheight + '"\n');
document.write('HSPACE="0"\n');
document.write('VSPACE="0">\n');







