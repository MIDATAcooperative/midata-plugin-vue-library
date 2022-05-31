# midata-plugin-vue-library
Midata server functions library for Vue.js based plugins

## midata.js - backend functions

### FHIR API

* setFhirVersion(version)
* fhirRead(resourceType, id, version)
* fhirCreate(resource)
* fhirUpdate(resource)
* fhirSearch(resourceType, params, unbundle)
* fhirTransaction(bundle)
* lastn(params, unbundle)

### Plugin Configuration

* getConfig()
* setConfig(config, autoimport)

### OAuth functions for importers

* getOAuthParams()
* oauth2Request(url, method, body)

## midataPortal.js - portal integration

* init($route)
* language
* owner
* resize()
* openLink(pos, url, params)
* openApp(pos, app, params)
* doneNotification()
* updateNotification()

