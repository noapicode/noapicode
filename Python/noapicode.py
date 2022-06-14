import json
import requests
import copy
import urllib.parse

_actions = None
_envs = None

def load(pathToFile):
    global _actions
    global _envs
    f = open(pathToFile)
    fileJSON = json.load(f)
    _actions = fileJSON["actions"]
    _envs = fileJSON["env"]   

def request(apiName, variables={}, env="default", folder="default"):

        data = _initActionData(folder + '/' + apiName, {}, variables, env)    

        # Prepare for request
        _configureHTTPVariables(data)
        vendorResponse = _makeRequest(data)

        return vendorResponse
    
    # --
    # Get Input Ready for HTTP Request
def _parseVariables( variable):
       '''
        return object is 
        {
            "variableName1": [startIndex,endIndex],
            "variableName2": [startIndex,endIndex],
        }
       '''
       tokens = {}
       previousTotal = 0
       while _getIndex(variable,"(") != -1:
          startIndex = _getIndex(variable,"(")
          token = variable[startIndex + 1:]
          endIndex = _getIndex(token,")")
          token = token[:endIndex]
          tokens[token] = [startIndex + previousTotal, startIndex + endIndex + previousTotal]
          previousTotal += startIndex + endIndex
          variable = variable[variable.index("(" + token + ")") + 2 + len(token):]

       return tokens

def _insertVariables(variableDict, valuesDict, str):
        newURL = str

        # when we change the length of array, we need to fix indexes
        # we need to look at the difference in size of what we took out vs in 
        # add that to the index
        # if we had x and we add xx then 2 - 1 is 1 and we add 1 
        # len(varValue) - len (varName)
        offset = 0
        for i in variableDict:
            value = ''
            if i in valuesDict:
                value = valuesDict[i]

            rightIndex = variableDict[i][0] + offset
            leftIndex = variableDict[i][1] + 2 + offset
            offset += ( len(value) -  len(i))

            newURL = str[0:rightIndex]
            newURL += value
            if len(str) > leftIndex:
                newURL += str[leftIndex:]
            str = newURL
        return newURL

def _configureHTTPVariables( data):

        urlVars = _parseVariables(data["url"])
        data["url"] = _insertVariables(urlVars, data["inputParams"], data["url"])
        
        if data["urlParams"] is not None:
            data["url"] += '?'
            for k in data["urlParams"]:
                if data["urlParams"][k] is None:
                    data["url"] += k + '=' + urllib.parse.quote(data["inputParams"][k]) + "&"
                else:
                    data["url"] += k + '=' + urllib.parse.quote(data["urlParams"][k]) + "&"
            data["url"] = data["url"][:len(data["url"]) - 1]

        if data["body"] is not None:
            bodyVars = _parseVariables(data["body"])
            data["body"] = _insertVariables(bodyVars, data["inputParams"], data["body"])

        if data["headers"] is not None:
            newHeaders = {}
            for k in data["headers"]:
                keyVars = _parseVariables(k)
                newKey = _insertVariables(keyVars, data["inputParams"],k)
                valueVars = _parseVariables(data["headers"][k])
                newValue = _insertVariables(valueVars, data["inputParams"], data["headers"][k])
                newHeaders[newKey] = newValue
            data["headers"] = newHeaders

    # --
    # Methods that make HTTP Request
def _makeRequest(data):

        currentAttempt = 0
        result = None
        workingOnReq = True
        while currentAttempt - 1 < data["retry"] and workingOnReq:
            
            try:
                req = _requestsWrapper(data["url"], data["method"], data["body"], data["headers"])
                if req.status_code >= 200 and req.status_code < 300:
                    result = None
                    try:
                        result = req.json()
                    except:
                        # not JSON
                        result = req.text

                    workingOnReq = False
                else:
                    if currentAttempt >= data['retry']:
                        raise Exception(req.text)
            except BaseException as e:
                err = e
                if currentAttempt >= data['retry']:
                    raise e
            currentAttempt += 1

        return result

def _requestsWrapper(url,method,body=None,headers=None, timeout=None):
        if method == "GET":
            return requests.get(url,headers=headers, timeout=timeout)
        elif method == "POST":
            return requests.post(url,headers=headers,data=body, timeout=timeout)
        elif method == "PUT":
            return requests.put(url,headers=headers,data=body, timeout=timeout)
        elif method == "DELETE":
            return requests.delete(url,headers=headers,data=body, timeout=timeout)        
        elif method == "OPTIONS":
            return requests.options(url,headers=headers,data=body, timeout=timeout)        
    
    # --
    # Utility Helpers
def _mergeDicts(a, b):
        for k in b:
            if k in a:
                a[k] = a[k] + b[k]
            else:
                a[k] = b[k]

def _getIndex( arg, token):
        try:
            return arg.index(token)
        except:
            return -1 

        
def _initActionData( actionId, data, inputParams, envId=None):
        global _actions
        global _envs
        if actionId not in _actions:
            raise Exception("actionId Not Found")
        
        data = copy.deepcopy(_actions[actionId])
        data["inputParams"] = inputParams

        if envId is not None:
            for k in _envs[envId]:
                data["inputParams"][k] = _envs[envId][k]


        return data
''' 
# Init APIGuy with Exported File
api = APIConnectar("C:\\Users\\Addie\\Downloads\\nasa.json")

# Configure Variables
variables = {
            "start_date":"2022-01-01", 
            "key":"ifEwOeBlHMQArC0RLSJZ6NqtxeD9OakEECMjpckB"
            }

# Send API Request
response = api.request("nasa", variables=variables)

# Print API Response
print(response)
'''