# TO DO: We need tests before moving forward, will work on this ASAP
# As placeholder putting simple api call

from ..noapicode import noapicode as api

api.load("../Tests/test1.json")

data = api.request('nasa', {'key': 'DEMO_KEY'})

print(data)

