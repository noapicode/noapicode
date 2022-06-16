const axios = require('axios')
fs = require('fs')

const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

let _actions = null
let _envs = null
let _loadingFile = null

async function load(pathToFile) {
    _loadingFile = loadFile(pathToFile)
    await _loadingFile
    return "Successfully loaded " + pathToFile
}

async function loadFile(pathToFile) {
        
    var fileContent = await readFileAsync(pathToFile)
    var fileJSON = JSON.parse(fileContent)
    _actions = fileJSON["actions"]
    _envs = fileJSON["env"]
    return false

}

async function request(apiName, variables={}, env="default", folder="default") {
        if (_loadingFile)
            await _loadingFile
        
        if (!_actions)
            throw new Error("No Actions Loaded, First Call the 'load' method")

        var data = _initActionData(folder + '/' + apiName, {}, variables, env)    

        _configureHTTPVariables(data)

        vendorResponse = await _makeRequest(data)

        return vendorResponse
    
}
    // Get Input Ready for HTTP Request
function _parseVariables( variable) {
       /*
        return object is 
        {
            "variableName1": [startIndex,endIndex],
            "variableName2": [startIndex,endIndex],
        }
       */
       tokens = {}
       previousTotal = 0
       while (_getIndex(variable,"(") != -1) {
          startIndex = _getIndex(variable,"(")
          token = variable.substring(startIndex + 1)
          endIndex = _getIndex(token,")")
          token = token.substring(0,endIndex)
          tokens[token] = [startIndex + previousTotal, startIndex + endIndex + previousTotal]
          previousTotal += startIndex + endIndex
          variable = variable.substring(variable.indexOf("(" + token + ")") + 2 + token.length)
        }
       return tokens
    }

function _insertVariables( variableDict, valuesDict, str) {
        var newURL = str

        /* when we change the length of array, we need to fix indexes
         we need to look at the difference in size of what we took out vs in 
         add that to the index
         if we had x and we add xx then 2 - 1 is 1 and we add 1 
         len(varValue) - len (varName)
        */
        var offset = 0
        for (var i in variableDict) {
            var value = ''
            if (i in valuesDict) {
                value = valuesDict[i]
            }

            rightIndex = variableDict[i][0] + offset
            leftIndex = variableDict[i][1] + 2 + offset
            offset += ( value.length -  i.length)

            newURL = str.substring(0,rightIndex)
            newURL += value
            if (str.length > leftIndex)
                newURL += str.substring(leftIndex)
            str = newURL
        }
        return newURL
    }

function _configureHTTPVariables( data) {

        var urlVars = _parseVariables(data["url"])
        data["url"] = _insertVariables(urlVars, data["inputParams"], data["url"])
        
        if (data["urlParams"] != null) {
            data["url"] += '?'
            for (var k in data["urlParams"]) {
                if (data["urlParams"][k] == null)
                    data["url"] += k + '=' + encodeURIComponent(data["inputParams"][k]) + "&"
                else
                    data["url"] += k + '=' + encodeURIComponent(data["urlParams"][k]) + "&"
            }
            data["url"] = data["url"].substring(0,data["url"].length - 1)
        }

        if (data["body"] != null) {
            bodyVars = _parseVariables(data["body"])
            data["body"] = _insertVariables(bodyVars, data["inputParams"], data["body"])
        }

        if (data["headers"] != null) {
            newHeaders = {}
            for (var k in data["headers"]){
                keyVars = _parseVariables(k)
                newKey = _insertVariables(keyVars, data["inputParams"],k)
                valueVars = _parseVariables(data["headers"][k])
                newValue = _insertVariables(valueVars, data["inputParams"], data["headers"][k])
                newHeaders[newKey] = newValue
            }
            data["headers"] = newHeaders
        }

}
    // Methods that make HTTP Request
async function _makeRequest(data,response=null) {

        var currentAttempt = 0
        var result = null
        var workingOnReq = true
        var lastStatus = null
        var error = null
        while (currentAttempt - 1 < data["retry"] && workingOnReq) {
            
            try {
                var req = await _requestsWrapper(data["url"], data["method"], data["body"], data["headers"])
                lastStatus = req.status
                if (req.status >= 200 && req.status < 300) {
                    result = req.data 
                    workingOnReq = false
                }
            }
            catch(err) {
                error = err.message
            }
            currentAttempt += 1
        }
        if (result == null)
            throw new Error(err)
        else {
            response = result
            return result
        }
}

async function _requestsWrapper(url,method,body=null,headers=null, timeout=60) {

        var httpConfig = {
            method: method,
            url: url,
            data: body,
            headers:headers,
            timeout:timeout  * 1000
        }

        var result = await axios(httpConfig)
        return result     
}

function _getIndex( arg, token) {

        try{
            return arg.indexOf(token)
        }
        catch(err) {}

     return -1 
 }
        
function _initActionData( actionId, data, inputParams, envId=null) {

        if (!(actionId in _actions))
            throw new Error("actionId '" + actionId + "' is not found")
        
        data = _deepCopy(_actions[actionId])
        data["inputParams"] = inputParams

        if (envId != null) {

            if (!(envId in _envs))
                throw new Error('ENV: "' + envId + '" is not found.')

            for (var k in _envs[envId]) {
                data["inputParams"][k] = _envs[envId][k]
            }
        }

        return data
}

function _deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj))
}

exports.load = load
exports.request = request

/*

Example:

load('/Users/addie/Downloads/noapicode.json')

request("nasa", {key:'DEMO_KEY'}).then((result) => {
    console.log(result)
})

*/