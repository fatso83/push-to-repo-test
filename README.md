# NG Azure REST API

This REST API serves as a layer in front of the NGT services, dealing with the requests coming from the framework
and also doing caching of the NGT services.

#The request data format

Definition dump from the class RESTPayload in the Frameowork

```typescript
export class RESTPayload extends TWPayload {
    serviceId:string;       // a unique UID
    servicename:string;     // the service name (i.e. getTrumfProfile)
    environment:string;     // preprod, prod, etc
    servicepath:string;     // the path part of the url (after the hostname)
    servicemethod:string;   // GET, PUT, POST, DELETE, ...
    payload:any;            // only relevant for PUT and POST
```

# Improvements to service caching
There needs to be improvements to the current caching

##Current module 'cachedService':
    1. Receives the whole requestBody object and does a call using the 'externalRequest' module
    2. Caches results based on the request's environment, service path, authorization header , and payload
    3. Stores a timestamp in the cached result
    4. The two last fields are only used if they exist, so they are not compulsory.
    5. Results are refreshed once a day.

## Non-standard error passing
Our redisCache module does not use the standard convention in node of having an error as the first callback argument.

## Required caching module for NGT services:
    * Should be able to warmup the cache before being hit by supplying it with a list of urls or request bodies
    * Configurable refresh interval
    * Needs per-service caching logic:
        * which urls to warm up
        * how often to refresh the cache
    * Can reuse points 1-4 in the old module
    * Needs to change #5  to support configurable intervals

