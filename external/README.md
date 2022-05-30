## agnitioExternal.js

The external post call reporting options available in Rainmaker allow the customers to include additional survey-like form to be filled out after the call is performed. One of the possibilities to use this feature is to display an external website, where the Sales Rep can fill out the required fields. This website is meant to be managed and hosted by the customer.

In order to enable communication between the website and the Engager device, it is required to embed the `agnitioExternal.min.js` library within the website.

### Example of an external post-call reporting target website

See [here](../docs/external).

### How to use

1. Download the JS file into your website project:

```
wget https://raw.githubusercontent.com/Agnitio/Agnitio-Content-API/master/external/agnitioExternal.min.js
```

2. Include the library in your HTML.

```
<script src="path/to/scripts/agnitioExternal.min.js"></script>
```

3. Start using the external post call reporting options!

### Available API methods

1. Get library version:

```
agExternal.getVersion();
```

2. Get script name:

```
agExternal.getName();
```

3. Mark the interaction as completed:

```
agExternal.markInteractionAsCompleted();
```

### Using version 1.0.1

1. Content-Api is supporting MyLive with v.1.0.1 for post call reporting
