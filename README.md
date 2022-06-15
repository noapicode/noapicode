<img src="https://app.noapicode.com/logo.png" alt="drawing" width="250"/>

## [NoAPIcode](https://www.noapicode.com/#/)

Consume API's with no code.

Connect Once, use across all platforms.

[Tutorial](https://www.youtube.com/watch?v=w5vroevzpzi)

# Documentation

### JavaScript:

```[bash]
npm install noapicode
```

Example Usage:

```[JavaScript]
       const api = require('noapicode')

       api.load('path to file')

       api.request('api name').then( (data) => {
           console.log(data)
       })
```

### Python:

```[bash]
pip install noapicode
```

Example Usage:

```
       import noapicode as api

       api.load('path to file')

       data = api.request('api name')

       print(data)
```
