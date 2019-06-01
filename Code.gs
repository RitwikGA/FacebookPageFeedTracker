/* Facebook Page Feed Live Tracking in Google Sheets & Analytics 
 * Description: Track Page Feed Event Like, Comment & Share.
 * @RitwikGA 
 * Website:www.Digishuffle.com
 *
 * Updated on 01-06-2019
 * - v3.3 Api upgrade
 * - Track Multiple Pages 
 * - New UI
 *
 * Updated on 13-10-2017
 * - All Event Logger
 */

function onOpen() {
SpreadsheetApp.getUi().createMenu('FB Feed').addItem("Start", 'fbAuth').addItem("Log Out", 'reset').addSeparator().addItem("Logger Template", 'makeSheetTemplate')
.addItem("oAuth Redirect URI", 'getValidOauthRedirectUrl').addToUi();
}

function getValidOauthRedirectUrl(){

var validOauthUrl = Utilities.formatString('https://developers.facebook.com/apps/%s/fb-login/settings/', PropertiesService.getScriptProperties().getProperty('CLIENT_ID'))
var htmlOutput = HtmlService
.createHtmlOutput('<style>span{font-size: 14px;font-weight: bold;text-decoration: underline;font-style: italic;cursor: pointer;}</style>'+
                  '<script>function selectURL(){document.getElementById("oauthURL").select();document.execCommand("copy")}</script>'+
                  '<p>Copy & Paste The Below URL In <a href="'+validOauthUrl+'"><i>Valid OAuth Redirect URIs</i></a></p>'+
                  '<br /><span onclick="selectURL()">Copy to Clipboard</span><textarea type="text" id="oauthURL" style="width:100%;">'+Utilities.formatString("https://script.google.com/macros/d/%s/usercallback", ScriptApp.getScriptId())+
                  '</textarea>')
    .setWidth(450)
    .setHeight(200);
SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Valid OAuth Redirect URIs')
}

function fbAuth(){
  var service = getService();
  var UI=HtmlService.createTemplateFromFile('digiModal').evaluate().setWidth(550)
  if(getService().hasAccess()) {UI=UI.setHeight(620)}
  else {UI = UI.setHeight(270)}
  SpreadsheetApp.getUi().showModalDialog(UI, "Facebook Page Feed Tracking")
 
}

 
function isScriptBlank(){
  var property = PropertiesService.getScriptProperties();
  var isSaved = property.getProperty('isSaved');
  return !JSON.parse(isSaved)
  }

function saveSettings(scriptObj){
var isSaved = false;
var property = PropertiesService.getScriptProperties();  
if(scriptObj){  
var appId = scriptObj["appId"]
var appSecret = scriptObj["appSecret"]
var sheetName = scriptObj["sheetName"]
var gaPropertyId = scriptObj["gaPropertyId"]
var sheetId = scriptObj["sheetId"]
isSaved = true;
  
property.setProperty('CLIENT_ID', appId)
property.setProperty('CLIENT_SECRET', appSecret)
property.setProperty('SHEET_NAME', sheetName)
property.setProperty('GA_PROPERTY_ID', gaPropertyId)
property.setProperty('SPREADSHEET_ID', sheetId)
property.setProperty('isSaved', isSaved)

} else {

property.setProperty('isSaved', isSaved)
}
fbAuth();
}

function doGet(e) {
if(e.parameter['hub.challenge']&&e.parameter['hub.mode']=='subscribe')
{
 return ContentService.createTextOutput(e.parameter['hub.challenge'])
}
}

function doPost(e) {
  
  var property = PropertiesService.getScriptProperties();
  var spreadsheetId = property.getProperty('SPREADSHEET_ID') 
  var sheetName = property.getProperty('SHEET_NAME')
  var gaPropertyId = property.getProperty('GA_PROPERTY_ID')
  
  var actionData=JSON.parse(e.postData.contents)
  actionData=actionData.entry[0].changes[0].value
  
  var parsed_data = parser(actionData)
  if(spreadsheetId && sheetName){
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if(parsed_data && sheet){
  sheet.getRange(sheet.getLastRow()+1,1,parsed_data.length,parsed_data[0].length).setValues(parsed_data)
  }
  }
  
  if(gaPropertyId && parsed_data){
  sendMPHit(gaPropertyId, parsed_data[0][2], parsed_data[0][4], parsed_data[0][5], parsed_data[0][6]);
  }

}

function sendMPHit(gaPropertyId, cid, ec, ea, el){

  var hitParams = {
    'v':'1',
    't':'event',
    'tid':gaPropertyId,
    'cid': cid,
    'ec':ec,
    'ea':ea,
    'el':el,
    'ni':'1'
  }
  
  var url = 'https://www.google-analytics.com/collect'
  var response = UrlFetchApp.fetch(url, {'method':'POST','payload':hitParams})  
}

function makeSheetTemplate(){
 
var headers = [['Date/Time','From Name','From ID','Post ID','Post URL','Action','Item','Message']]
var property = PropertiesService.getScriptProperties();
var spreadsheetId = property.getProperty('SPREADSHEET_ID') 
var sheetName = property.getProperty('SHEET_NAME')
  
if (spreadsheetId && sheetName)
{  
var sheet = SpreadsheetApp.openById(spreadsheetId)
var output_sheet = getSheet(sheet,sheetName )

if(output_sheet.getRange(1,1).getValue()=="")
{   
output_sheet.getRange(1,1,1,headers[0].length).setBackground('#6569e1')
output_sheet.getRange(1,1,1,headers[0].length).setFontColor('white')
output_sheet.getRange(1,1,1,headers[0].length).setFontSize('12')
output_sheet.getRange(1,1,1,headers[0].length).setValues(headers)  
}
  return output_sheet
}
  else {return false}
}



function parser(data)
{
var ar = Array.apply(null, Array(8)).map(function() { return 0 });
var ar1 = []
var data = data;
  
  for (i in data)
  {
    if(i=="created_time")
    {
      var t = new Date(parseInt(data[i])*1000)
      t = t.toLocaleDateString() +" "+ t.toLocaleTimeString()
      ar[0] = t
    }
    if(i=="from")
    {
      ar[1] = data[i]['name']
      ar[2] = data[i]['id']
    }
    if(i=="post_id")
    {
      ar[3] = data[i]
      ar[4] = getURL(data[i])
    }
    if(i=="verb")
    {ar[5] = data[i]} 
    if(i=="item")
    {
      if(data[i] === 'like'){return false}
      ar[6] = data[i]
      if(data[i] === 'reaction')
      {ar[6] = data['reaction_type']}
    }
    if(i=="message")
    {ar[7] = data[i]}
    
  }
  ar1.push(ar)
  return ar1  
}




function reset() {
  var service = getService();
  service.reset();
  SpreadsheetApp.getUi().alert('Log Out Success')
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Facebook')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://www.facebook.com/dialog/oauth')
      .setTokenUrl('https://graph.facebook.com/v3.3/oauth/access_token')

      // Set the client ID and secret.
      .setClientId(PropertiesService.getScriptProperties().getProperty('CLIENT_ID'))
      .setClientSecret(PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET'))

      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
      .setCallbackFunction('authCallback')
  
  
      //Set Scope
      .setScope('manage_pages') 
  

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth callback.
 */

function authCallback(request) {
  var service = getService();  
  var authorized = service.handleCallback(request);
  if (authorized) { 
    fbAuth();
    return HtmlService.createHtmlOutput('OAuth Success!!!<script>window.top.close()</script>');
  } else {
    return HtmlService.createHtmlOutput('Access Denied. Check your page name or access level');
  }
}



function fetchPage(){
  var service = getService();
  if(!service.hasAccess()) {return}
  var url = 'https://graph.facebook.com/v3.3/me/accounts?fields=name,access_token';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + service.getAccessToken()
    }
  });
  var result = JSON.parse(response);
  if(result['data'])
  {
    var count = result['data'].length
    var counter = 0;
    var newArr = []
    while(counter < count){
      var newObj = {};
      var resultData = result['data'][counter] 
     
      var subscribedUrl = 'https://graph.facebook.com/v3.3/'+resultData['id']+'/subscribed_apps';
      var subscribedResponse = UrlFetchApp.fetch(subscribedUrl, {
        headers: {
          'Authorization': 'Bearer ' + resultData['access_token']
        },method : 'GET'
      });
      var parsedresponse = JSON.parse(subscribedResponse);
      
      if(parsedresponse.data.length > 0){
      newObj['status'] = 'Yes' 
      } else {newObj['status'] = 'No'}
      newObj['access_token'] = resultData['access_token']
      newObj['id'] = resultData['id']
      newObj['name'] = resultData['name']
      newArr.push(newObj)
      counter++;
    }
    return {page_data : newArr}     
  }
}

// Subscribe Page to App
function pageSubscribe(pageId, token, isOn)
{
  
  var url = 'https://graph.facebook.com/v3.3/'+pageId+'/subscribed_apps';
  var params = {
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  }
  
  if(isOn){
    var payload = {'subscribed_fields':'feed'}  
    params['method'] = 'POST';
    params['payload'] = JSON.stringify(payload);
    params['contentType'] = 'application/json';
    
  } else {
    params['method'] = 'DELETE';
  }
  
  var response = UrlFetchApp.fetch(url, params);
  var status = JSON.stringify(response)
  
  var statusCode = response.getResponseCode()
  var statustxt = ''
  if(statusCode == '200') {statustxt = 'SUCCESS'}
  else{statustxt = 'FAILED'}
  return {status: statustxt}  
  
}



function getURL(id)
{
return "https://www.facebook.com/"+id
}

// Handle The Facebook Post Requests & Send to Analytics Servers
function getSheet(sht,name){
  var sh2 =sht.getSheetByName(name);
  if(sh2)
   {
    return sht.getSheetByName(name)}
    else 
    { var sh2=sht.insertSheet(name)
           return sh2 
    }  
}
