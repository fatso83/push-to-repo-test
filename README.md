# NG Azure REST API

This REST API serves as a layer in front of the NGT services, dealing with the requests coming from the framework
and also doing caching of the NGT services.

# Getting started
Install a local redis server and fire it up: `redis-server`.
See the CONFIGURATION section for how to override settings, for instance using an Azure instance of Redis.

```
node app.js
```

# Running Tests

# Run all tests
Run `npm test` from the top directory

## Excluding slow integration tests
```
mocha --recursive  --invert --grep '^slow.' spec/
```

# Configuration
Configuration is performed by looking up environment variables and loading the right configuration profile.
Passwords/keys should not be checked in.

## Example
The following will also work in Windows using CygWin. Env vars can also be set in your IDE.

```
export REDIS_KEY=rrDI123lkjADSFASDE=
export CONFIGURATION_PROFILE=production

node app.js
```

## Environment variables

- CONFIGURATION_PROFILE *The basename of the json file to load*.
- PORT *The port to listen for connections - defaults to 3000 *
- REDIS_URI *The redis host*
- REDIS_PORT *The redis port - the client does not support HTTPS on 6380 yet*
- REDIS_KEY *The key/password*

** Tip:** These may be passed in as the app i started, i.e. 
```
$ PORT='3000' REDIS_URI='def' node app.js
```
** Note for Visual Studio Users:** variables are set in the project file (view properties) and wil load when application is started on debug (F5)

## Other variables that can be set in the configuration files
- port - *The port to listen for connections - defaults to 3000 *
- minimum framework version
- logging.level *ALL|TRACE|DEBUG|INFO|WARN|ERROR*
- caching.environment sets the request environment used when fetching data from the services. Used by the external request module and the request builder.

# Description of modules

## RequestCacher
    1. Receives the requestBody object in handleRequest and does a call using the 'externalRequest' module
    2. Caches results based on the request's environment, service path, authorization header , and payload
    3. Stores a timestamp in the cached result
    4. The two last fields are only used if they exist, so they are not compulsory.
    5. Results are refreshed as configured

## PollingCacher
Used for warming and refreshing caches. A thin wrapper around the `RequestCacher`, that is internally for the
actual caching logic.

```javascript
var p = new PollingCacher();
p.addRequest(requestBody, { intervalInSeconds: 60 }
p.addRequest(requestBody2, { intervalInSeconds: 60*60*24 }
p.start();
```

# Implementation notes

##The request data format used internally

Definition dump from the class RESTPayload in the Frameowork

```typescript
export class RESTPayload {
        servicename:string;      // the service name (i.e. getTrumfProfile)
        environment:string;      // preproduction, production, etc
        servicepath:string;      // the path part of the url (after the hostname)
        servicemethod:string;    // GET, PUT, POST, DELETE, ...
        payload:any;             // only relevant for PUT and POST
        headers:Array<any>;
```

