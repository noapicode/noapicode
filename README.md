NoAPIcode
-------------
noapicode.com
--------------

Consume API's with no code.

Connect Once, use across all platforms.

How to Use the Website: 
https://www.youtube.com/watch?v=w5vROeVzpZI


JavaScript:
---------------------
npm install noapicode
---------------------
  
Example Usage:

       const api = require('noapicode')
       
       api.load('path to file')
       
       api.request('api name').then( (data) => {
           console.log(data)
       })
  
Python:
---------------------
pip install noapicode 
---------------------

Example Usage:  
        
       import noapicode as api  
        
       api.load('path to file')  
        
       data = api.request('api name')  
        
       print(data)
