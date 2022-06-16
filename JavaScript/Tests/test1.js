// TO DO: We need tests before moving forward, will work on this ASAP
// As placeholder putting simple api call

const api = require("../noapicode")

api.load("../Tests/test1.json")

api.request('nasa', {key:'DEMO_KEY'}).then( (result) => {

    if ("near_earth_objects" in result) {
        console.log("NASA Test Success!")
    }
    else {
        console.log("NASA Test Failed!")
    }
    
})